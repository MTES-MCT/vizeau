import type { StyleSpecification } from 'maplibre-gl'
import photo from './photo.json'
import planIGN from './plan-ign.json'
import vector from './vector.json'

export const BASE_MAPS = {
  'vector': { label: 'Carte vectorielle', style: vector as unknown as StyleSpecification },
  'orthophoto': { label: 'Photographie aérienne', style: photo as unknown as StyleSpecification },
  'plan-ign': { label: 'Plan IGN', style: planIGN as unknown as StyleSpecification },
}

export type BaseMapId = keyof typeof BASE_MAPS

export const BASE_MAP_OPTIONS = Object.entries(BASE_MAPS).map(([value, { label }]) => ({
  value: value as BaseMapId,
  label,
}))
