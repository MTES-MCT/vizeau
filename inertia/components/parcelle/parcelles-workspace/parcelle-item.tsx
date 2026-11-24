import { fr } from '@codegouvfr/react-dsfr'
import Badge from '@codegouvfr/react-dsfr/Badge'
import Button from '@codegouvfr/react-dsfr/Button'
import type { ReactNode } from 'react'

import type { SelectedParcelle } from '~/components/map/parcelles-selection-map'
import { getCultureByCode } from '~/functions/cultures_group'

type ParcelleItemProps = {
  parcelle: SelectedParcelle
  isNew?: boolean
  /** Parcelle retirée du brouillon : barrée, avec un bouton pour la restaurer. */
  onRestore?: (parcelle: SelectedParcelle) => void
  /** Exploitation du projet qui déclare la parcelle, ou mention de son absence. */
  exploitationName?: string
  /** Mention sur la parcelle, par exemple son rattachement à une autre exploitation. */
  status?: string
  /** Commande affichée à droite de la ligne, comme un interrupteur de sélection. */
  action?: ReactNode
  onClick: (parcelle: SelectedParcelle) => void
  /** Ligne survolée ou atteinte au clavier, puis quittée (`null`) : pour la montrer sur la carte. */
  onHoverChange?: (parcelle: SelectedParcelle | null) => void
}

/* Ligne de parcelle, cliquable pour la montrer sur la carte quand elle est localisée. */
export default function ParcelleItem({
  parcelle,
  isNew = false,
  onRestore,
  exploitationName,
  status,
  action,
  onClick,
  onHoverChange,
}: ParcelleItemProps) {
  const culture = getCultureByCode(parcelle.cultureCode)
  const isRemoved = Boolean(onRestore)
  const mentionColor = fr.colors.decisions.text.mention.grey.default
  const metas = [
    parcelle.surface === null || parcelle.surface === undefined
      ? 'Surface non renseignée'
      : `${parcelle.surface} ha`,
    `RPG ${parcelle.rpgId}`,
    exploitationName,
    status,
  ].filter(Boolean)

  const content = (
    <>
      <span
        className="inline-block w-3 h-3 rounded-full shrink-0 fr-mt-1v"
        style={{ backgroundColor: culture.color, opacity: isRemoved ? 0.4 : 1 }}
        aria-hidden="true"
      />
      <span className="flex flex-col flex-1 min-w-0">
        <span
          className="fr-text--sm fr-text--bold fr-mb-0 truncate"
          style={{
            textDecoration: isRemoved ? 'line-through' : undefined,
            color: isRemoved ? mentionColor : undefined,
          }}
        >
          {culture.label}
        </span>
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
      onMouseEnter={onHoverChange && (() => onHoverChange(parcelle))}
      onMouseLeave={onHoverChange && (() => onHoverChange(null))}
      onFocus={onHoverChange && (() => onHoverChange(parcelle))}
      onBlur={onHoverChange && (() => onHoverChange(null))}
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
      {action && <div className="shrink-0 fr-pr-1w">{action}</div>}
      {onRestore && (
        <Button
          priority="tertiary no outline"
          iconId="fr-icon-arrow-go-back-line"
          size="small"
          title={`Restaurer la parcelle RPG ${parcelle.rpgId}`}
          onClick={() => onRestore(parcelle)}
        />
      )}
    </li>
  )
}
