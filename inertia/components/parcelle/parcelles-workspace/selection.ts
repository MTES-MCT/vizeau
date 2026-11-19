import type { SelectedParcelle } from '~/components/map/parcelles-selection-map'
import { getCultureByCode } from '~/functions/cultures_group'
import type { StackedProgressBarSegment } from '~/ui/StackedProgressBar'

/** Parcelles sélectionnées, par millésime RPG. */
export type ParcellesSelection = Record<string, SelectedParcelle[]>

export type MillesimeChanges = { millesime: string; added: number; removed: number }

export const plural = (count: number, word: string) => `${count} ${word}${count > 1 ? 's' : ''}`

/** Texte comparable pour une recherche, sans tenir compte de la casse ni des accents. */
export const normalizeSearch = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

export const formatHectares = (surface: number) =>
  surface.toLocaleString('fr-FR', { maximumFractionDigits: 1 })

export const formatSurface = (parcelles: SelectedParcelle[]) =>
  formatHectares(parcelles.reduce((sum, parcelle) => sum + (parcelle.surface ?? 0), 0))

/** Surface cumulée par culture, de la plus étendue à la moins étendue. */
export function getCulturesSegments(parcelles: SelectedParcelle[]): StackedProgressBarSegment[] {
  const segments = new Map<string, StackedProgressBarSegment>()
  for (const parcelle of parcelles) {
    const { label, color } = getCultureByCode(parcelle.cultureCode)
    const segment = segments.get(label) ?? { label, color, value: 0 }
    segment.value += parcelle.surface ?? 0
    segments.set(label, segment)
  }
  return [...segments.values()].sort((a, b) => b.value - a.value)
}

export function getChanges(
  initial: ParcellesSelection,
  draft: ParcellesSelection
): MillesimeChanges[] {
  const millesimes = new Set([...Object.keys(initial), ...Object.keys(draft)])
  return [...millesimes]
    .sort()
    .reverse()
    .map((millesime) => {
      const initialIds = new Set((initial[millesime] ?? []).map((p) => p.rpgId))
      const draftIds = new Set((draft[millesime] ?? []).map((p) => p.rpgId))
      return {
        millesime,
        added: [...draftIds].filter((id) => !initialIds.has(id)).length,
        removed: [...initialIds].filter((id) => !draftIds.has(id)).length,
      }
    })
    .filter(({ added, removed }) => added > 0 || removed > 0)
}

export function describeChanges({ added, removed }: MillesimeChanges) {
  return [
    added > 0 && `+${plural(added, 'nouvelle')}`,
    removed > 0 && `−${plural(removed, 'retirée')}`,
  ]
    .filter(Boolean)
    .join(' · ')
}
