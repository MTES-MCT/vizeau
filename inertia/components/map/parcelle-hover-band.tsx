import { fr } from '@codegouvfr/react-dsfr'

import { getCultureByCode } from '~/functions/cultures_group'
import type { ParcelleAgricole } from './styles/parcelles-agricoles'

/** Situation de la parcelle survolée par rapport à la sélection en cours d'édition. */
export type HoveredParcelleStatus = 'selected' | 'available' | 'unavailable'

type ParcelleHoverBandProps = {
  parcelle: ParcelleAgricole | null
  /** Absente en consultation. */
  status?: HoveredParcelleStatus
  /** Exploitation Viz'Eau de la parcelle, quand l'écran la connaît. */
  exploitationName?: string
}

const mentionColor = fr.colors.decisions.text.mention.grey.default

const STATUS = {
  selected: {
    icon: 'fr-icon-check-line',
    text: 'Dans la sélection',
    color: fr.colors.decisions.text.default.success.default,
  },
  available: {
    icon: 'fr-icon-info-line',
    text: 'Parcelle disponible',
    color: fr.colors.decisions.text.default.info.default,
  },
  unavailable: {
    icon: 'fr-icon-warning-line',
    text: 'Rattachée à une exploitation',
    color: fr.colors.decisions.text.default.warning.default,
  },
}

/*
 * Bandeau au-dessus de la carte qui décrit la parcelle survolée, à la place d'une infobulle
 * qui suivrait le pointeur. Sa hauteur est fixe : la carte ne bouge pas d'une parcelle à
 * l'autre.
 */
export default function ParcelleHoverBand({
  parcelle,
  status,
  exploitationName,
}: ParcelleHoverBandProps) {
  return (
    <div
      className="shrink-0 flex flex-col justify-center fr-px-2w overflow-hidden"
      style={{
        height: '3.5rem',
        background: fr.colors.decisions.background.default.grey.default,
        borderBottom: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
      }}
    >
      {parcelle ? (
        <ParcelleDescription
          parcelle={parcelle}
          status={status}
          exploitationName={exploitationName}
        />
      ) : (
        <p className="fr-text--sm fr-mb-0" style={{ color: mentionColor }}>
          Survolez une parcelle pour afficher ses informations.
        </p>
      )}
    </div>
  )
}

function ParcelleDescription({
  parcelle,
  status,
  exploitationName,
}: ParcelleHoverBandProps & { parcelle: ParcelleAgricole }) {
  const culture = getCultureByCode(parcelle.cultureCode)
  const statusInfo = status && STATUS[status]

  return (
    <>
      <div className="flex items-center gap-2 min-w-0 fr-text--sm fr-mb-0">
        <span
          className="inline-block w-3 h-3 rounded-sm shrink-0"
          style={{ backgroundColor: culture.color }}
          aria-hidden="true"
        />
        <span className="font-bold truncate">{culture.label}</span>
        <span className="shrink-0" style={{ color: mentionColor }}>
          {parcelle.surface === null
            ? 'Surface non renseignée'
            : `${parcelle.surface.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} ha`}
        </span>
        {parcelle.bio && (
          <span
            className="shrink-0 fr-text--xs fr-mb-0 fr-px-1w rounded-full"
            style={{
              color: fr.colors.decisions.text.default.success.default,
              border: `1px solid ${fr.colors.decisions.text.default.success.default}`,
            }}
          >
            Bio
          </span>
        )}
      </div>
      <div className="flex items-center gap-3 min-w-0 fr-text--xs fr-mb-0">
        {statusInfo && (
          <span className="shrink-0" style={{ color: statusInfo.color }}>
            <span className={`${statusInfo.icon} fr-icon--xs fr-mr-1v`} aria-hidden="true" />
            {statusInfo.text}
          </span>
        )}
        {exploitationName && (
          <span className="truncate">
            <span className="fr-icon-building-line fr-icon--xs fr-mr-1v" aria-hidden="true" />
            {exploitationName}
          </span>
        )}
      </div>
    </>
  )
}
