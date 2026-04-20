import { AacService } from '#services/aac_service'
import { AacDto } from '../dto/aac_dto.js'
import { inject } from '@adonisjs/core'
import { InstallationInfo, CultureInfo, AacJson } from '../../types/aac.js'

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

@inject()
export class AacCsvService {
  constructor(private aacService: AacService) {}

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
        'Captages actifs',
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
      'Captage rattaché - Code',
      'Captage rattaché - Nom',
      'Captage rattaché - Code BSS',
      'Captage rattaché - État',
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
            inst.prioritaire ? 'Oui' : 'Non',
            null,
            null,
            null,
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
              inst.prioritaire ? 'Oui' : 'Non',
              cap.code,
              cap.nom,
              cap.code_bss,
              cap.etat,
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
    if (!aac.culture_evolution?.repartition) return null
    const evoHeaders = ['Année', 'Culture', 'Surface (ha)', 'Nb parcelles']
    const evoRows: string[] = []
    for (const [culture, years] of Object.entries(aac.culture_evolution.repartition)) {
      for (const [year, detail] of Object.entries(years)) {
        if (!detail) continue
        evoRows.push(
          buildRow([
            culture,
            year,
            String(detail.surface_ha ?? ''),
            String(detail.nb_parcelles ?? ''),
          ])
        )
      }
    }
    return buildSection(evoHeaders, evoRows)
  }

  private async buildQualiteEauSection(installations: InstallationInfo[]): Promise<string | null> {
    const headers: string[] = []
    const rows: string[] = []
    let headersSet = false

    for (const inst of installations) {
      let years: string[]
      try {
        years = await this.aacService.getAnalysesRobinetYears(inst.code)
      } catch {
        continue
      }

      for (const yearStr of years) {
        const y = Number.parseInt(yearStr, 10)
        if (Number.isNaN(y)) continue

        let analyses: Record<string, unknown>[]
        try {
          analyses = await this.aacService.getAnalysesRobinet(inst.code, y)
        } catch {
          continue
        }

        for (const analyse of analyses) {
          if (!headersSet && Object.keys(analyse).length > 0) {
            headers.push('Installation', ...Object.keys(analyse))
            headersSet = true
          }
          rows.push(
            buildRow([
              inst.code,
              ...Object.values(analyse).map((v) => (v !== null ? String(v) : '')),
            ])
          )
        }
      }
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
