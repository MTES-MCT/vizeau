import type { MetasListProps } from '~/ui/MetasList'

type AacMetasInput = {
  code: string | null
  surface: number | null
  nb_captages_actifs: number | null
  nb_communes: number | null
}

/**
 * Builds the metas shown on an AAC/territoire list item (DepassementsListItem):
 * SANDRE code, surface, active captages, communes — each omitted when unset.
 */
export function getAacListItemMetas(aac: AacMetasInput): MetasListProps['metas'] {
  return [
    {
      content: aac.code ? `Code SANDRE : ${aac.code}` : 'Territoire non identifié au SANDRE',
      iconId: aac.code ? 'fr-icon-hashtag' : 'fr-icon-error-warning-line',
    },
    ...(aac.surface
      ? [
          {
            content: `${Math.round(aac.surface)} ha`,
            iconId: 'fr-icon-ruler-line',
          },
        ]
      : []),
    ...(aac.nb_captages_actifs
      ? [
          {
            content: `${aac.nb_captages_actifs} captage${aac.nb_captages_actifs > 1 ? 's' : ''} actif${aac.nb_captages_actifs > 1 ? 's' : ''}`,
            iconId: 'fr-icon-drop-line',
          },
        ]
      : []),
    ...(aac.nb_communes
      ? [
          {
            content: `${aac.nb_communes} commune${aac.nb_communes > 1 ? 's' : ''}`,
            iconId: 'fr-icon-government-line',
          },
        ]
      : []),
  ]
}
