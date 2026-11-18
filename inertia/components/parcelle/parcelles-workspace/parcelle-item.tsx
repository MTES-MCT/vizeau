import { fr } from '@codegouvfr/react-dsfr'
import Badge from '@codegouvfr/react-dsfr/Badge'

import type { SelectedParcelle } from '~/components/map/parcelles-selection-map'
import { getCultureByCode } from '~/functions/cultures_group'

type ParcelleItemProps = {
  parcelle: SelectedParcelle
  isNew?: boolean
  onClick: (parcelle: SelectedParcelle) => void
}

/* Ligne de parcelle, cliquable pour la montrer sur la carte quand elle est localisée. */
export default function ParcelleItem({ parcelle, isNew = false, onClick }: ParcelleItemProps) {
  const culture = getCultureByCode(parcelle.cultureCode)
  const mentionColor = fr.colors.decisions.text.mention.grey.default
  const metas = [
    parcelle.surface === null || parcelle.surface === undefined
      ? 'Surface non renseignée'
      : `${parcelle.surface} ha`,
    `RPG ${parcelle.rpgId}`,
  ]

  const content = (
    <>
      <span
        className="inline-block w-3 h-3 rounded-full shrink-0 fr-mt-1v"
        style={{ backgroundColor: culture.color }}
        aria-hidden="true"
      />
      <span className="flex flex-col flex-1 min-w-0">
        <span className="fr-text--sm fr-text--bold fr-mb-0 truncate">{culture.label}</span>
        <span className="fr-text--xs fr-mb-0" style={{ color: mentionColor }}>
          {metas.join(' · ')}
        </span>
      </span>
      {isNew && (
        <Badge small noIcon severity="success" className="shrink-0">
          Nouveau
        </Badge>
      )}
    </>
  )

  const rowClassName = 'flex flex-1 items-start gap-2 min-w-0 fr-px-1w fr-py-1w text-left'

  return (
    <li
      className="flex items-center border-b last:border-b-0"
      style={{ borderColor: fr.colors.decisions.border.default.grey.default }}
    >
      {parcelle.centroid ? (
        <button
          type="button"
          className={`${rowClassName} cursor-pointer hover:bg-(--background-default-grey-hover)`}
          title="Voir la parcelle sur la carte"
          onClick={() => onClick(parcelle)}
        >
          {content}
        </button>
      ) : (
        <div className={rowClassName}>{content}</div>
      )}
    </li>
  )
}
