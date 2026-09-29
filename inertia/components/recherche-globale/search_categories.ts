import type { FrIconClassName } from '@codegouvfr/react-dsfr'
import type { GlobalSearchCategory } from '#types/recherche'

export type SearchCategory = {
  id: GlobalSearchCategory
  label: string
  hint: string
  iconId: FrIconClassName
}

export const SEARCH_CATEGORIES: SearchCategory[] = [
  {
    id: 'exploitations',
    label: 'Exploitations',
    hint: 'par nom, commune ou code postal',
    iconId: 'fr-icon-map-pin-user-line',
  },
  {
    id: 'aac',
    label: 'AAC',
    hint: 'par nom ou code SANDRE',
    iconId: 'fr-icon-hexagon-line',
  },
  {
    id: 'points',
    label: 'Points de prélèvement',
    hint: 'par nom ou code BSS',
    iconId: 'fr-icon-drop-line',
  },
  {
    id: 'projets',
    label: 'Projets',
    hint: 'par intitulé',
    iconId: 'fr-icon-briefcase-line',
  },
  {
    id: 'taches',
    label: 'Tâches programmées',
    hint: 'par intitulé',
    iconId: 'fr-icon-time-line',
  },
]

export const CATEGORY_BY_ID = Object.fromEntries(
  SEARCH_CATEGORIES.map((category) => [category.id, category])
) as Record<GlobalSearchCategory, SearchCategory>
