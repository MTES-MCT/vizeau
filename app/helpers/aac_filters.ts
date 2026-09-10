import type { HttpContext } from '@adonisjs/core/http'

export type AacDepassementsFilters = {
  depassementsReglementaires: boolean
  depassementsAlerte: boolean
}

/**
 * Parses the "aacDepassementsReglementaires"/"aacDepassementsAlerte" boolean query params
 * shared by every page that renders the AAC list with its dépassement filter
 * (aac/index, territoires/index, visualisation).
 */
export function parseAacDepassementsFilters(
  request: HttpContext['request']
): AacDepassementsFilters {
  return {
    depassementsReglementaires: request.input('aacDepassementsReglementaires') === 'true',
    depassementsAlerte: request.input('aacDepassementsAlerte') === 'true',
  }
}
