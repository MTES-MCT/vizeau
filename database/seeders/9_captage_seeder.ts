import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Captage from '#models/captage'
import { DuckdbService, getAacFilesS3Driver } from '#services/duckdb_service'

function normalizeString(value: unknown): string | null {
  if (typeof value !== 'string') return null

  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
}

function getStatePriority(state: string): number {
  return state.toUpperCase() === 'ACTIF' ? 0 : 1
}

const COMPARED_FIELDS = ['name', 'bssCode', 'state', 'commune', 'type', 'prioritaire'] as const

type CaptageRow = Pick<Captage, 'code' | (typeof COMPARED_FIELDS)[number]>

export default class CaptageSeeder extends BaseSeeder {
  public async run() {
    const rows = await this.fetchCaptagesFromParquet()

    if (process.env.DRY_RUN) {
      await this.previewChanges(rows)
      return
    }

    await Captage.updateOrCreateMany('code', rows)
  }

  /**
   * Returns all captages extracted from AAC installations.
   * The source parquet may contain the same installation across multiple AACs,
   * so rows are deduplicated to satisfy unique constraints on `code` and `bssCode`.
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
        const bssCode = normalizeString(installation.code_bss)
        const state = normalizeString(installation.etat)

        if (!code || !name || !bssCode || !state) return []

        return [
          {
            code,
            name,
            bssCode,
            state,
            commune: normalizeString(installation.commune),
            type: normalizeString(installation.type),
            prioritaire: installation.prioritaire === true,
          },
        ]
      })
      .sort((left, right) => {
        const byState = getStatePriority(left.state) - getStatePriority(right.state)
        if (byState !== 0) return byState

        const byCode = left.code.localeCompare(right.code)
        if (byCode !== 0) return byCode

        const byBssCode = left.bssCode.localeCompare(right.bssCode)
        if (byBssCode !== 0) return byBssCode

        return left.name.localeCompare(right.name)
      })

    const captagesByCode = new Map<string, CaptageRow>()
    const usedBssCodes = new Set<string>()

    for (const captage of candidates) {
      if (captagesByCode.has(captage.code)) continue
      if (usedBssCodes.has(captage.bssCode)) continue

      captagesByCode.set(captage.code, captage)
      usedBssCodes.add(captage.bssCode)
    }

    return Array.from(captagesByCode.values())
  }

  private async previewChanges(rows: CaptageRow[]) {
    const currentCaptages = await Captage.all()
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

    console.log(`\n[DRY RUN] Captages to create (${toCreate.length})`)
    if (toCreate.length > 0) console.table(toCreate)
    console.log(`\n[DRY RUN] Captage fields to update (${toUpdate.length})`)
    if (toUpdate.length > 0) console.table(toUpdate)
  }
}
