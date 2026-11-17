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

// Les champs optionnels ci-dessous sont apparus dans aac.parquet en novembre 2026 : ils sont
// absents (undefined) quand l'application lit un fichier antérieur.

export type CaptageRattache = {
  code: string
  nom: string
  // Ancien code BSS, avec sa désignation (`06992X0035/P1`)
  code_bss: string | null
  // Nouveau code BSS (`BSS001SEGK`)
  code_bss_nouveau?: string | null
  etat: string
}

/**
 * Origine du lien entre une installation et l'AAC, de la plus sûre à la moins sûre.
 * Libellés : SOURCE_RATTACHEMENT_LABELS (app/services/aac_csv_service.ts et inertia/functions/aac.ts).
 */
export type SourceRattachement =
  'sandre' | 'export' | 'champ_captant' | 'point' | 'perimetre' | 'proximite'

export type InstallationInfo = {
  code: string
  nom: string
  // Ancien code BSS, avec sa désignation (`06992X0035/P1`) ; l'indice seul avant novembre 2026
  code_bss: string | null
  // Nouveau code BSS (`BSS001SEGK`)
  code_bss_nouveau?: string | null
  commune: string
  departement: string
  type: string
  nature: string
  usage: string
  etat: string
  code_ppe: string
  // Statut dans l'AAC qui contient l'installation ; NULL vaut « non prioritaire »
  prioritaire: boolean | null
  captages_rattaches: CaptageRattache[] | null
  source_rattachement?: SourceRattachement | null
  // true si le lien avec l'AAC est déduit de la géographie, et non donné par une table officielle
  recroisement_geographique?: boolean | null
  // true si l'installation est affichée à part de la liste principale ; NULL vaut false
  a_part?: boolean | null
  motif_a_part?: 'abandon_aep' | 'autre_usage' | null
  // Motif à afficher tel quel (« Abandonné pour l'eau potable »…)
  libelle_a_part?: string | null
  depassements_alerte?: number
  depassements_reglementaires?: number
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
