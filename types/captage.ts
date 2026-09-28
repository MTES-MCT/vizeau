export type AnalysesStats = {
  total: number
  depassements_alerte: number
  depassements_reglementaires: number
}

// Conformity stats for every user territoire that has an AAC code, keyed by territoire id.
// Used to build the "territoires suivis à risque" home page widget.
export type ConformiteRepartitionJson = {
  parTerritoire: Record<string, AnalysesStats>
  // The first territoires with at least one dépassement, and how many there are in total.
  territoireIdsARisque: string[]
  totalTerritoiresARisque: number
}

export type SubstanceAlerteJson = {
  code_parametre: number
  libelle_parametre: string
  // Percentage of analyses exceeding the threshold for this substance's type.
  taux_depassement: number
  type: 'reglementaire' | 'alerte'
  // Concentration measured at the most recent analysis for this substance.
  derniere_valeur: number
  code_unite: string
}

// Top 5 substances at risk, all-time, across every installation of every user territoire
// that has an AAC code — both combined and per territoire. Used to build the
// "top 5 des substances à risque" home page widget.
export type SubstancesRepartitionJson = {
  tousTerritoires: SubstanceAlerteJson[]
  parTerritoire: Record<string, SubstanceAlerteJson[]>
}

// One installation (point de prélèvement) belonging to a user territoire and having at least
// one dépassement on record, with the AAC it belongs to so it can be linked to.
// Used to build the "points de prélèvement à risque" home page widget.
export type CaptageAlerteJson = {
  code: string
  nom: string
  commune: string
  departement: string
  aac_code: string
  aac_nom: string
  depassements_alerte: number
  depassements_reglementaires: number
}

export type AnalysesPerYear = {
  annee: number
  total: number
  avec_dep: number
  sans_dep: number
}

export type SubstanceItem = {
  code_parametre: number
  libelle_parametre: string
  code_unite: string
  has_dep: boolean
  nb_dep_regl: number
  nb_dep_alerte: number
  nb_total: number
  frequence_dep_regl: number
  max_value: number
}

export type SubstanceChroniqueInfo = {
  code_parametre: number
  libelle_parametre: string
  code_unite: string
  seuil_regl: number | null
  seuil_alerte: number | null
}

export type SubstanceChroniqueStats = {
  moyenne: number
  maximum: number
  nb_total: number
  nb_dep_regl: number
  frequence_dep_regl: number
}

export type SubstanceChroniquePoint = {
  date: string
  valeur: number
  statut: 'conforme' | 'dep_alerte' | 'dep_regl'
}

export type ChroniqueData = {
  info: SubstanceChroniqueInfo
  stats: SubstanceChroniqueStats
  series: SubstanceChroniquePoint[]
}
