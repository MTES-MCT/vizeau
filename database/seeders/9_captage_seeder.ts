import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Captage from '#models/captage'
import { DuckdbService, getAacFilesS3Driver } from '#services/duckdb_service'
import Env from '#start/env'

function normalizeString(value: unknown): string | null {
  if (typeof value !== 'string') return null

  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
}

function getStatePriority(state: string): number {
  return state.toUpperCase() === 'ACTIF' ? 0 : 1
}

const COMPARED_FIELDS = [
  'name',
  'bssCode',
  'newBssCode',
  'state',
  'commune',
  'type',
  'prioritaire',
] as const

// Nombre d'exemples de changement de code BSS affichés en mode DRY_RUN
const BSS_CODE_CHANGES_EXAMPLES = 10

type CaptageRow = Pick<Captage, 'code' | (typeof COMPARED_FIELDS)[number]>

export default class CaptageSeeder extends BaseSeeder {
  public async run() {
    const rows = await this.fetchCaptagesFromParquet()

    if (Env.get('DRY_RUN')) {
      await this.previewChanges(rows)
      return
    }

    await Captage.updateOrCreateMany('code', rows)
  }

  /**
   * Renvoie les captages tirés des installations des AAC, un par code d'installation.
   *
   * Une même installation peut figurer dans plusieurs AAC. Ses attributs y sont identiques, sauf
   * `prioritaire`, qui dépend de l'AAC depuis novembre 2026 : le captage est enregistré comme
   * prioritaire s'il l'est dans au moins une AAC où il n'est pas à part. Un captage à part
   * (abandonné ou hors eau potable) n'est pas présenté comme prioritaire, comme dans l'interface.
   *
   * Les installations sans aucun code BSS sont gardées : c'est `code` qui identifie le captage.
   * Les installations affichées à part dans une AAC (`a_part` : abandonnées, ou hors eau potable)
   * le sont aussi, comme les autres captages abandonnés.
   *
   * Les nouveaux champs (`code_bss_nouveau`) sont lus dans la structure dépliée, pour que la
   * requête fonctionne aussi sur les fichiers antérieurs à novembre 2026, qui ne les ont pas.
   */
  private async fetchCaptagesFromParquet(): Promise<CaptageRow[]> {
    const rows = await new DuckdbService().query<Record<string, unknown>>(
      'SELECT unnest(installations) AS installation FROM read_parquet($path) WHERE installations IS NOT NULL',
      { path: `s3://${getAacFilesS3Driver().options.bucket}/aac.parquet` }
    )

    const candidates = rows
      .map((row) => row.installation as Record<string, unknown> | null)
      .flatMap((installation): CaptageRow[] => {
        if (!installation || typeof installation !== 'object') return []

        const code = normalizeString(installation.code)
        const name = normalizeString(installation.nom)
        const state = normalizeString(installation.etat)

        if (!code || !name || !state) return []

        return [
          {
            code,
            name,
            bssCode: normalizeString(installation.code_bss),
            newBssCode: normalizeString(installation.code_bss_nouveau),
            state,
            commune: normalizeString(installation.commune),
            type: normalizeString(installation.type),
            prioritaire: installation.prioritaire === true && installation.a_part !== true,
          },
        ]
      })
      .sort((left, right) => {
        const byState = getStatePriority(left.state) - getStatePriority(right.state)
        if (byState !== 0) return byState

        const byCode = left.code.localeCompare(right.code)
        if (byCode !== 0) return byCode

        return left.name.localeCompare(right.name)
      })

    const captagesByCode = new Map<string, CaptageRow>()

    for (const captage of candidates) {
      const existing = captagesByCode.get(captage.code)
      if (existing) {
        existing.prioritaire = existing.prioritaire || captage.prioritaire
        continue
      }

      captagesByCode.set(captage.code, { ...captage })
    }

    return Array.from(captagesByCode.values())
  }

  private async previewChanges(rows: CaptageRow[]) {
    const currentCaptages = await Captage.query().withCount('projects')
    const existing = new Map(currentCaptages.map((c) => [c.code, c]))

    const toCreate = rows.filter((r) => !existing.has(r.code))
    const toUpdate = rows.flatMap((row) => {
      const current = existing.get(row.code)
      if (!current) return []

      return COMPARED_FIELDS.filter((field) => current[field] !== row[field]).map((field) => ({
        code: row.code,
        field,
        from: current[field],
        to: row[field],
      }))
    })

    // Le format de l'ancien code BSS a changé pour presque tous les captages (indice seul,
    // puis indice et désignation) : ces changements sont résumés plutôt que listés.
    const bssCodeChanges = toUpdate.filter((change) => change.field === 'bssCode')
    const otherChanges = toUpdate.filter((change) => change.field !== 'bssCode')

    const codesInParquet = new Set(rows.map((r) => r.code))
    const missing = currentCaptages
      .filter((captage) => !codesInParquet.has(captage.code))
      .map((captage) => ({
        code: captage.code,
        name: captage.name,
        state: captage.state,
        projects: Number(captage.$extras.projects_count ?? 0),
      }))
      .sort((a, b) => b.projects - a.projects || a.code.localeCompare(b.code))

    console.log(`\n[DRY RUN] Captages to create (${toCreate.length})`)
    if (toCreate.length > 0) console.table(toCreate)

    console.log(
      `\n[DRY RUN] Old BSS codes to update (${bssCodeChanges.length}), ` +
        `first ${Math.min(BSS_CODE_CHANGES_EXAMPLES, bssCodeChanges.length)} as examples`
    )
    if (bssCodeChanges.length > 0) console.table(bssCodeChanges.slice(0, BSS_CODE_CHANGES_EXAMPLES))

    console.log(`\n[DRY RUN] Other captage fields to update (${otherChanges.length})`)
    if (otherChanges.length > 0) console.table(otherChanges)

    console.log(
      `\n[DRY RUN] Captages in database missing from aac.parquet (${missing.length}), ` +
        `kept as is (${missing.filter((m) => m.projects > 0).length} linked to projects)`
    )
    if (missing.length > 0) console.table(missing)
  }
}
