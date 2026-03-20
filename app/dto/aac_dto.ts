import { AacJson, CultureInfo, InstallationInfo } from '../../types/aac.js'

export type AacSummaryJson = {
  code: string
  nom: string
  surface: number
  nb_captages_actifs: number
  nb_communes: number
  date_maj: string
  date_creation: string
  bbox: [number, number, number, number] | null
  communes: AacJson['communes']
  nb_parcelles: number
  surface_agricole_bio: AacJson['surface_agricole_bio']
  surface_agricole_ppe: Record<string, CultureInfo>
  surface_agricole_ppr: Record<string, CultureInfo>
  surface_agricole_utile: Record<string, CultureInfo>
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
      nb_communes: (row.communes as AacJson['communes'])?.nb_communes ?? 0,
      date_maj: AacDto.formatDate(row.date_maj),
      date_creation: AacDto.formatDate(row.date_creation),
      bbox: (row.bbox ?? null) as [number, number, number, number] | null,
      communes: row.communes as AacSummaryJson['communes'],
      nb_parcelles: row.nb_parcelles as number,
      surface_agricole_bio:
        (row.surface_agricole_bio as AacJson['surface_agricole_bio']) ??
        ({
          nb_parcelles: 0,
          surface: 0,
          part_bio: 0,
          evolution: [],
        } as AacJson['surface_agricole_bio']),
      surface_agricole_ppe: row.surface_agricole_ppe as Record<string, CultureInfo>,
      surface_agricole_ppr: row.surface_agricole_ppr as Record<string, CultureInfo>,
      surface_agricole_utile: row.surface_agricole_utile as Record<string, CultureInfo>,
    }
  }

  static fromRaw(row: Record<string, unknown>): AacJson {
    return {
      code: row.code as string,
      nom: row.nom as string,
      prioritaire: row.prioritaire as boolean,
      date_creation: AacDto.formatDate(row.date_creation),
      date_maj: AacDto.formatDate(row.date_maj),
      bbox: (row.bbox ?? null) as [number, number, number, number] | null,
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
