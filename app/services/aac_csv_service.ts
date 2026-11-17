import { AacService } from '#services/aac_service'
import { AacDto } from '../dto/aac_dto.js'
import { inject } from '@adonisjs/core'
import { InstallationInfo, CultureInfo, AacJson, SourceRattachement } from '#types/aac'

const SEPARATOR = ';'
const LINE_END = '\r\n'
const BOM = '\uFEFF'

function escapeField(value: string | null | undefined): string {
  const str = value ?? ''
  const safeStr = /^\s*[=+\-@]/.test(str) ? `'${str}` : str
  return `"${safeStr.replace(/"/g, '""')}"`
}

function buildRow(fields: (string | null | undefined)[]): string {
  return fields.map((f) => escapeField(f)).join(SEPARATOR)
}

function buildSection(headers: string[], rows: string[]): string {
  const lines = [buildRow(headers), ...rows, '']
  return lines.join(LINE_END)
}

function wrapCsv(sections: string[]): string {
  return BOM + sections.join(LINE_END)
}

/**
 * Libellés de l'origine du rattachement d'une installation à l'AAC (`source_rattachement`).
 * À garder alignés avec SOURCE_RATTACHEMENT_LABELS de inertia/functions/aac.ts.
 */
const SOURCE_RATTACHEMENT_LABELS: Record<SourceRattachement, string> = {
  sandre: 'Référentiel des AAC du Sandre',
  export: 'Liste nationale des captages prioritaires',
  champ_captant: "Même champ captant qu'un point de prélèvement de l'AAC",
  point: "Point de prélèvement situé dans l'AAC",
  perimetre: "Périmètre de protection du point de prélèvement dans l'AAC",
  proximite: "Seul point de prélèvement à proximité immédiate de l'AAC",
}

/**
 * Statut prioritaire d'une installation dans l'AAC. Une installation à part (abandonnée ou hors
 * eau potable) n'est pas présentée comme prioritaire, comme dans l'interface : elle ne l'est que
 * par défaut, quand la liste nationale ne lui donne aucune AAC valide.
 */
function isPrioritaire(inst: InstallationInfo): boolean {
  return inst.prioritaire === true && inst.a_part !== true
}

/**
 * Colonnes ajoutées en novembre 2026 pour une installation. Vides quand le fichier ne fournit
 * pas ces champs (fichiers antérieurs).
 */
function buildInstallationNewFields(inst: InstallationInfo): (string | null | undefined)[] {
  const source = inst.source_rattachement
  const recroisement = inst.recroisement_geographique
  return [
    inst.code_bss_nouveau,
    source ? (SOURCE_RATTACHEMENT_LABELS[source] ?? source) : null,
    recroisement === true ? 'Oui' : recroisement === false ? 'Non' : null,
    inst.a_part === true ? inst.libelle_a_part : null,
  ]
}

@inject()
export class AacCsvService {
  constructor(protected aacService: AacService) {}

  private async getAacDto(aacCode: string): Promise<AacJson | null> {
    const raw = await this.aacService.getByCode(aacCode)
    if (!raw) return null
    return AacDto.fromRaw(raw)
  }

  private buildInfoGeneraleSection(aac: AacJson): string {
    return buildSection(
      [
        'Code',
        'Nom',
        'Prioritaire',
        'Surface (ha)',
        'Points de prélèvement actifs',
        'Installations',
        'Surface agricole (ha)',
        'Parcelles',
        'Date création',
        'Date MAJ',
      ],
      [
        buildRow([
          aac.code,
          aac.nom,
          aac.prioritaire ? 'Oui' : 'Non',
          String(aac.surface ?? ''),
          String(aac.nb_captages_actifs ?? ''),
          String(aac.nb_installations ?? ''),
          String(aac.surface_agricole ?? ''),
          String(aac.nb_parcelles ?? ''),
          aac.date_creation,
          aac.date_maj,
        ]),
      ]
    )
  }

  private buildCaptagesSection(installations: InstallationInfo[]): string {
    const headers = [
      'Code',
      'Nom',
      'Code BSS',
      'Commune',
      'Département',
      'Type',
      'Nature',
      'Usage',
      'État',
      'Code PPE',
      'Prioritaire',
      'Point de prélèvement rattaché - Code',
      'Point de prélèvement rattaché - Nom',
      'Point de prélèvement rattaché - Code BSS',
      'Point de prélèvement rattaché - État',
      'Nouveau code BSS',
      'Origine du rattachement',
      'Recroisement géographique',
      'À part',
      'Point de prélèvement rattaché - Nouveau code BSS',
    ]
    const rows: string[] = []
    for (const inst of installations) {
      const captages = inst.captages_rattaches ?? []
      if (captages.length === 0) {
        rows.push(
          buildRow([
            inst.code,
            inst.nom,
            inst.code_bss,
            inst.commune,
            inst.departement,
            inst.type,
            inst.nature,
            inst.usage,
            inst.etat,
            inst.code_ppe,
            isPrioritaire(inst) ? 'Oui' : 'Non',
            null,
            null,
            null,
            null,
            ...buildInstallationNewFields(inst),
            null,
          ])
        )
      } else {
        for (const cap of captages) {
          rows.push(
            buildRow([
              inst.code,
              inst.nom,
              inst.code_bss,
              inst.commune,
              inst.departement,
              inst.type,
              inst.nature,
              inst.usage,
              inst.etat,
              inst.code_ppe,
              isPrioritaire(inst) ? 'Oui' : 'Non',
              cap.code,
              cap.nom,
              cap.code_bss,
              cap.etat,
              ...buildInstallationNewFields(inst),
              cap.code_bss_nouveau,
            ])
          )
        }
      }
    }
    return buildSection(headers, rows)
  }

  private buildAssolementSection(aac: AacJson): string {
    const assolementHeaders = ['Zone', 'Culture', 'Nb parcelles', 'Surface (ha)', 'SAU (%)']
    const assolementRows: string[] = []

    const zones: { label: string; data: Record<string, CultureInfo> | null }[] = [
      { label: 'SAU (Surface Agricole Utile)', data: aac.surface_agricole_utile },
      { label: 'PPE (Périmètre de Protection Éloigné)', data: aac.surface_agricole_ppe },
      { label: 'PPR (Périmètre de Protection Rapproché)', data: aac.surface_agricole_ppr },
    ]

    for (const zone of zones) {
      if (!zone.data) continue
      for (const [culture, info] of Object.entries(zone.data)) {
        if (!info) continue
        assolementRows.push(
          buildRow([
            zone.label,
            culture,
            info.nb_parcelles !== null ? String(info.nb_parcelles) : '',
            info.surface !== null ? String(info.surface) : '',
            info.SAU !== null ? String(info.SAU) : '',
          ])
        )
      }
    }

    if (aac.surface_agricole_bio) {
      const bio = aac.surface_agricole_bio
      assolementRows.push(
        buildRow([
          'Bio (global)',
          'Total',
          String(bio.nb_parcelles ?? ''),
          String(bio.surface ?? ''),
          String(bio.part_bio ?? ''),
        ])
      )
      for (const ev of bio.evolution ?? []) {
        assolementRows.push(
          buildRow([
            'Bio (évolution)',
            String(ev.annee),
            String(ev.nb_parcelles ?? ''),
            String(ev.surface ?? ''),
            '',
          ])
        )
      }
    }

    return buildSection(assolementHeaders, assolementRows)
  }

  private buildCultureEvolutionSection(aac: AacJson): string | null {
    const repartition = aac.culture_evolution?.repartition
    if (!repartition) return null

    const years = Object.keys(repartition).sort((a, b) => Number(a) - Number(b))
    if (years.length === 0) return null

    const cultureNames = Array.from(
      new Set(years.flatMap((year) => Object.keys(repartition[year] ?? {})))
    ).sort((a, b) => a.localeCompare(b))

    if (cultureNames.length === 0) return null

    const headers = ['Culture', 'Indicateur', ...years]
    const rows: string[] = []

    for (const cultureName of cultureNames) {
      const surfaceRow = buildRow([
        cultureName,
        'Surface (ha)',
        ...years.map((year) => {
          const detail = repartition[year]?.[cultureName]
          return detail?.surface_ha !== null && detail?.surface_ha !== undefined
            ? String(detail.surface_ha)
            : ''
        }),
      ])

      const parcellesRow = buildRow([
        cultureName,
        'Nb parcelles',
        ...years.map((year) => {
          const detail = repartition[year]?.[cultureName]
          return detail?.nb_parcelles !== null && detail?.nb_parcelles !== undefined
            ? String(detail.nb_parcelles)
            : ''
        }),
      ])

      rows.push(surfaceRow, parcellesRow)
    }

    return buildSection(headers, rows)
  }

  private async buildQualiteEauSection(installations: InstallationInfo[]): Promise<string | null> {
    const headers: string[] = []
    const rows: string[] = []

    const codes = installations.map((inst) => inst.code)
    let analyses: Record<string, unknown>[]
    try {
      analyses = await this.aacService.getAnalysesRobinetForExport(codes)
    } catch {
      return null
    }

    if (analyses.length > 0 && Object.keys(analyses[0]).length > 0) {
      headers.push(...Object.keys(analyses[0]))
    }

    for (const analyse of analyses) {
      rows.push(buildRow(Object.values(analyse).map((v) => (v !== null ? String(v) : ''))))
    }

    if (rows.length === 0) return null
    return buildSection(headers, rows)
  }

  async exportInfoGenerale(aacCode: string): Promise<string | null> {
    const aac = await this.getAacDto(aacCode)
    if (!aac) return null
    return wrapCsv([this.buildInfoGeneraleSection(aac)])
  }

  async exportCaptages(aacCode: string): Promise<string | null> {
    const aac = await this.getAacDto(aacCode)
    if (!aac) return null
    return wrapCsv([this.buildCaptagesSection(aac.installations ?? [])])
  }

  async exportAssolement(aacCode: string): Promise<string | null> {
    const aac = await this.getAacDto(aacCode)
    if (!aac) return null
    return wrapCsv([this.buildAssolementSection(aac)])
  }

  async exportCultureEvolution(aacCode: string): Promise<string | null> {
    const aac = await this.getAacDto(aacCode)
    if (!aac) return null
    const section = this.buildCultureEvolutionSection(aac)
    if (!section) return null
    return wrapCsv([section])
  }

  async exportQualiteEau(aacCode: string): Promise<string | null> {
    const aac = await this.getAacDto(aacCode)
    if (!aac) return null
    const section = await this.buildQualiteEauSection(aac.installations ?? [])
    if (!section) return null
    return wrapCsv([section])
  }
}
