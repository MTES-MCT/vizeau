import { fr } from '@codegouvfr/react-dsfr'
import type { InstallationInfo, SourceRattachement } from '#types/aac'
import type { MetasListProps } from '~/ui/MetasList'
import type { TagsListProps } from '~/ui/TagsList'

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

export type RecroisementMention = { label: string; description: string }

/**
 * Mentions qui signalent un lien avec l'AAC déduit de la géographie. Les descriptions
 * s'affichent en infobulle, à côté du libellé.
 */
export const RECROISEMENT_MENTIONS = {
  recroisement: {
    label: 'Recroisement géographique',
    description:
      "Lien avec l'AAC déduit de la position géographique, et non d'une table officielle (référentiel des AAC du Sandre ou liste nationale des captages prioritaires).",
  },
  champ_captant: {
    label: 'Même champ captant',
    description:
      "Partage le périmètre de protection rapprochée d'un point de prélèvement officiellement rattaché à l'AAC. Lien déduit de la géographie, et non d'une table officielle.",
  },
} satisfies Record<string, RecroisementMention>

/**
 * Mention d'une installation : « Même champ captant » pour un captage qui partage le périmètre
 * de protection d'un captage officiellement rattaché, « Recroisement géographique » pour les
 * autres liens déduits de la géographie.
 * Null quand le lien vient d'une table officielle, ou que le fichier ne le précise pas.
 */
export function getRecroisementMention(
  installation: RecroisementInput
): RecroisementMention | null {
  if (installation.source_rattachement === 'champ_captant') {
    return RECROISEMENT_MENTIONS.champ_captant
  }
  if (installation.recroisement_geographique === true) {
    return RECROISEMENT_MENTIONS.recroisement
  }
  return null
}

// Couleurs des tags en hexadécimal : CustomTag en déduit la couleur du texte, ce qu'il ne sait
// pas faire à partir des variables CSS de fr.colors. Comme les autres tags, ils ne suivent pas
// le mode sombre.
export const TAG_COLORS = fr.colors.getHex({ isDark: false }).decisions.background.contrast

/** Tag d'une mention, avec sa description en infobulle. */
export function getRecroisementTag(mention: RecroisementMention) {
  // Le gris est pris par le motif « à part »
  const color = mention === RECROISEMENT_MENTIONS.champ_captant ? 'purpleGlycine' : 'info'
  return { label: mention.label, color: TAG_COLORS[color].default, tooltip: mention.description }
}

/** Sévérité de l'état d'une installation, pour la ligne d'état de sa carte et de sa fiche. */
export function getEtatSeverity(etat: string): 'success' | 'error' {
  return etat === 'ACTIF' ? 'success' : 'error'
}

/**
 * Tag du motif « à part ». Pour un point d'eau potable abandonné, le libellé du fichier
 * (« Abandonné pour l'eau potable ») répétait l'état du Sandre (« Abandonné (sans précision) »),
 * qui ne précise que la façon dont il a été abandonné : le tag dit plutôt ce qu'était le point.
 * Pour un autre usage, le libellé du fichier nomme l'usage et reste affiché tel quel.
 */
function getMotifAPartTag(
  installation: Pick<InstallationInfo, 'motif_a_part' | 'libelle_a_part'>
): { label: string; tooltip?: string } | null {
  if (installation.motif_a_part === 'abandon_aep') {
    return {
      label: "Ancien point d'eau potable",
      tooltip:
        "Ce point de prélèvement servait à l'eau potable et a été abandonné. Il n'est pas compté dans les indicateurs de l'AAC.",
    }
  }
  if (!installation.libelle_a_part) return null
  return {
    label: installation.libelle_a_part,
    tooltip:
      installation.motif_a_part === 'autre_usage'
        ? "Ce point de prélèvement sert à un autre usage que l'eau potable. Il n'est pas compté dans les indicateurs de l'AAC."
        : undefined,
  }
}

/**
 * Tags d'une installation, sur sa carte comme sur sa fiche : motif « à part » (en gris), puis
 * mention de recroisement, chacun avec son explication en infobulle.
 */
export function getInstallationTags(
  installation: RecroisementInput &
    Pick<InstallationInfo, 'a_part' | 'motif_a_part' | 'libelle_a_part'>
): TagsListProps['tags'] {
  const motifTag = isInstallationAPart(installation) ? getMotifAPartTag(installation) : null
  const recroisement = getRecroisementMention(installation)
  return [
    ...(motifTag ? [{ ...motifTag, color: TAG_COLORS.grey.default }] : []),
    ...(recroisement ? [getRecroisementTag(recroisement)] : []),
  ]
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
