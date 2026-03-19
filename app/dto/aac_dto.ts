export type CommuneInfo = {
  code_insee: string
  surface: number
  repartition: number
}

export type CaptageRattache = {
  code: string
  nom: string
  code_bss: string
  etat: string
}

export type InstallationInfo = {
  code: string
  nom: string
  code_bss: string
  commune: string
  departement: string
  type: string
  nature: string
  usage: string
  etat: string
  code_ppe: string
  prioritaire: boolean
  captages_rattaches: CaptageRattache[]
}

export type CultureInfo = {
  nb_parcelles: number | null
  surface: number | null
  SAU: number | null
} | null

export type AacSummaryJson = {
  code: string
  nom: string
  surface: number
  nb_captages_actifs: number
  nb_communes: number
  date_maj: string
}

export type AacListJson = {
  data: AacSummaryJson[]
  meta: {
    total: number
    perPage: number
    currentPage: number
    lastPage: number
  }
}

export type AacJson = {
  code: string
  nom: string
  prioritaire: boolean
  date_creation: string
  date_maj: string
  surface: number
  nb_captages_actifs: number
  nb_installations: number
  surface_agricole: number
  nb_parcelles: number
  communes: {
    nb_communes: number
    communes: Record<string, CommuneInfo>
  }
  surface_agricole_utile: Record<string, CultureInfo>
  surface_agricole_ppe: Record<string, CultureInfo>
  surface_agricole_ppr: Record<string, CultureInfo>
  surface_agricole_bio: {
    nb_parcelles: number
    surface: number
    part_bio: number
    evolution: { annee: number; nb_parcelles: number; surface: number }[]
  }
  installations: InstallationInfo[]
  nb_analyses: { year: number; count: number }[]
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
      surface_agricole_utile: row.surface_agricole_utile as Record<string, CultureInfo>,
      surface_agricole_ppe: row.surface_agricole_ppe as Record<string, CultureInfo>,
      surface_agricole_ppr: row.surface_agricole_ppr as Record<string, CultureInfo>,
      surface_agricole_bio: row.surface_agricole_bio as AacJson['surface_agricole_bio'],
      installations: row.installations as InstallationInfo[],
      nb_analyses: (row.nb_analyses as { year: number; count: number }[]) ?? [],
    }
  }
}
