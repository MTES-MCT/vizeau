import { AacJson, CultureInfo, InstallationInfo } from '../../types/aac.js'

export type AacSummaryJson = {
  code: string
  nom: string
  surface: number
  nb_captages_actifs: number
  nb_communes: number
  date_maj: string
}

export class AacDto {
  private static formatDate(val: unknown): string {
    if (!val) return ''
    if (val instanceof Date) return val.toISOString().slice(0, 10)
    if (typeof val === 'string') return val.slice(0, 10)
    return String(val)
  }

  static fromRawSummary(row: Record<string, unknown>): AacSummaryJson {
    return {
      code: row.code as string,
      nom: row.nom as string,
      surface: row.surface as number,
      nb_captages_actifs: row.nb_captages_actifs as number,
      nb_communes: row.nb_communes as number,
      date_maj: AacDto.formatDate(row.date_maj),
    }
  }

  static fromRaw(row: Record<string, unknown>): AacJson {
    return {
      code: row.code as string,
      nom: row.nom as string,
      prioritaire: row.prioritaire as boolean,
      date_creation: AacDto.formatDate(row.date_creation),
      date_maj: AacDto.formatDate(row.date_maj),
      surface: row.surface as number,
      nb_captages_actifs: row.nb_captages_actifs as number,
      nb_installations: row.nb_installations as number,
      surface_agricole: row.surface_agricole as number,
      nb_parcelles: row.nb_parcelles as number,
      communes: row.communes as AacJson['communes'],
      surface_agricole_utile: row.surface_agricole_utile as Record<string, CultureInfo> | null,
      surface_agricole_ppe: row.surface_agricole_ppe as Record<string, CultureInfo> | null,
      surface_agricole_ppr: row.surface_agricole_ppr as Record<string, CultureInfo> | null,
      surface_agricole_bio: row.surface_agricole_bio as AacJson['surface_agricole_bio'],
      culture_evolution: ((row as any).culture_evolution ??
        (row as any).cultures_evolution ??
        null) as AacJson['culture_evolution'],
      installations: row.installations as InstallationInfo[],
    }
  }
}
