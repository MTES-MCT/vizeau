import type { InstallationInfo, SourceRattachement } from '#types/aac'
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
            content: `${aac.nb_captages_actifs} point${aac.nb_captages_actifs > 1 ? 's' : ''} de prélèvement actif${aac.nb_captages_actifs > 1 ? 's' : ''}`,
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

/**
 * Libellés de l'origine du rattachement d'une installation à l'AAC (`source_rattachement`).
 * À garder alignés avec SOURCE_RATTACHEMENT_LABELS de app/services/aac_csv_service.ts.
 */
export const SOURCE_RATTACHEMENT_LABELS: Record<SourceRattachement, string> = {
  sandre: 'Référentiel des AAC du Sandre',
  export: 'Liste nationale des captages prioritaires',
  champ_captant: "Même champ captant qu'un point de prélèvement de l'AAC",
  point: "Point de prélèvement situé dans l'AAC",
  perimetre: "Périmètre de protection du point de prélèvement dans l'AAC",
  proximite: "Seul point de prélèvement à proximité immédiate de l'AAC",
}

type RecroisementInput = Pick<InstallationInfo, 'source_rattachement' | 'recroisement_geographique'>

/**
 * Mention qui signale un lien avec l'AAC déduit de la géographie, et son explication :
 * « Même champ captant » pour un captage qui partage le périmètre de protection d'un captage
 * officiellement rattaché, « Recroisement géographique » pour les autres.
 * Null quand le lien vient d'une table officielle, ou que le fichier ne le précise pas.
 */
export function getRecroisementMention(
  installation: RecroisementInput
): { label: string; description: string } | null {
  if (installation.source_rattachement === 'champ_captant') {
    return {
      label: 'Même champ captant',
      description:
        "Ce point de prélèvement partage le périmètre de protection rapprochée d'un point de prélèvement officiellement rattaché à l'AAC. Ce lien est déduit de la géographie : il ne vient pas d'une table officielle.",
    }
  }
  if (installation.recroisement_geographique === true) {
    return {
      label: 'Recroisement géographique',
      description:
        "Le lien entre ce point de prélèvement et l'AAC est déduit de leur position géographique : il ne vient pas d'une table officielle (référentiel des AAC du Sandre ou liste nationale des captages prioritaires).",
    }
  }
  return null
}

/** Libellé lisible de l'origine du rattachement, null si le fichier ne la précise pas. */
export function getSourceRattachementLabel(
  installation: Pick<InstallationInfo, 'source_rattachement'>
): string | null {
  const source = installation.source_rattachement
  return source ? (SOURCE_RATTACHEMENT_LABELS[source] ?? source) : null
}

/** Une installation est à part quand `a_part` vaut true ; NULL ou absent valent false. */
export function isInstallationAPart(installation: Pick<InstallationInfo, 'a_part'>): boolean {
  return installation.a_part === true
}

/**
 * Commune d'un captage, suivie de son département quand il est connu.
 * Certains captages n'ont ni commune ni département dans aac.parquet.
 */
export function formatCaptageCommune(
  commune: string | null | undefined,
  departement: string | null | undefined
): string {
  if (!commune) return 'Commune non renseignée'
  return departement ? `${commune} (${departement})` : commune
}
