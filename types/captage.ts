export type AnalysesStats = {
  total: number
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
