// Thématiques de la recherche générale, dans l'ordre d'affichage.
export const GLOBAL_SEARCH_CATEGORIES = [
  'exploitations',
  'aac',
  'points',
  'projets',
  'taches',
] as const

export type GlobalSearchCategory = (typeof GLOBAL_SEARCH_CATEGORIES)[number]

export type GlobalSearchItemJson = {
  id: string
  title: string
  subtitle: string | null
  href: string
}

export type GlobalSearchGroupJson = {
  category: GlobalSearchCategory
  total: number
  items: GlobalSearchItemJson[]
}
