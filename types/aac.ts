export type CommuneInfo = {
  code_insee: string
  surface: number
  repartition: number
}
export type CultureInfo = {
  nb_parcelles: number | null
  surface: number | null
  SAU: number | null
} | null

export type CultureEvolutionDetail = {
  surface_ha: number
  nb_parcelles: number
} | null

export type CultureEvolutionInfo = {
  aac: string
  nom: string
  repartition: Record<string, Record<string, CultureEvolutionDetail>>
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

export type AacAnalysesSummaryJson = {
  nb_analyses: number
  nb_parametres: number
  yearMin?: number | null
  yearMax?: number | null
}

export type AacJson = {
  code: string
  nom: string
  prioritaire: boolean
  date_creation: string
  date_maj: string
  bbox: [number, number, number, number] | null
  surface: number
  nb_captages_actifs: number
  nb_installations: number
  surface_agricole: number
  nb_parcelles: number
  communes: {
    nb_communes: number
    communes: Record<string, CommuneInfo>
  }
  surface_agricole_utile: Record<string, CultureInfo> | null
  surface_agricole_ppe: Record<string, CultureInfo> | null
  surface_agricole_ppr: Record<string, CultureInfo> | null
  surface_agricole_bio: {
    nb_parcelles: number
    surface: number
    part_bio: number
    evolution: { annee: number; nb_parcelles: number; surface: number }[]
  }
  culture_evolution: CultureEvolutionInfo | null
  installations: InstallationInfo[]
}
