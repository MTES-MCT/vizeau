import { createRoot } from 'react-dom/client'
import { fr } from '@codegouvfr/react-dsfr'

import GroupCulture from '~/components/groupe-culture-tag'
import Divider from '~/ui/Divider'
import LabelInfo from '~/ui/LabelInfo'
import { ReactNode } from 'react'
import Tag from '@codegouvfr/react-dsfr/Tag'

interface PopupParcelleProps {
  codeGroup: string
  millesime: string
  comment?: string
  surfParc: string
  isParcelleUnavailable: boolean
  isBio?: boolean
  isEditMode?: boolean
  isOwnParcelle?: boolean
}

function StatusBadge({ isAvailable }: { isAvailable: boolean }) {
  const config = isAvailable
    ? {
        icon: 'fr-icon-info-fill',
        text: 'Parcelle disponible',
        color: fr.colors.decisions.text.default.info.default,
      }
    : {
        icon: 'fr-icon-warning-fill',
        text: 'Parcelle déjà attribuée',
        color: fr.colors.decisions.text.default.warning.default,
      }

  return (
    <div className="text-sm fr-mt-1w">
      <span
        className={`${config.icon} fr-mr-1w`}
        aria-hidden="true"
        style={{ color: config.color }}
      />
      {config.text}
    </div>
  )
}

function ExploitationInfo({ name }: { name: string }) {
  return (
    <div
      className="flex fr-mt-2w fr-p-1w"
      style={{ backgroundColor: fr.colors.decisions.background.alt.grey.default }}
    >
      <span
        className="fr-icon-building-line"
        aria-hidden="true"
        style={{ color: fr.colors.decisions.text.actionHigh.blueFrance.default }}
      />
      <div className="fr-pl-2w">{name}</div>
    </div>
  )
}

export default function PopupParcelle({
  codeGroup,
  surfParc,
  millesime,
  comment,
  isBio,
  isParcelleUnavailable = false,
  isEditMode = false,
  isOwnParcelle = false,
}: PopupParcelleProps) {
  const ownershipInfo: ReactNode[] = []

  if (isOwnParcelle) {
    ownershipInfo.push(<ExploitationInfo name={'Cette exploitation possède cette parcelle'} />)
  }
  if (isEditMode && !isOwnParcelle) {
    ownershipInfo.push(<StatusBadge isAvailable={!isParcelleUnavailable} />)
  }

  return (
    <div
      style={{
        minWidth: '200px',
        backgroundColor: fr.colors.decisions.background.default.grey.default,
      }}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <GroupCulture code_group={codeGroup} size="sm" />
        {comment && (
          <Tag
            small
            iconId="fr-icon-draft-line"
            style={{
              backgroundColor: fr.colors.decisions.background.alt.blueFrance.default,
              color: fr.colors.decisions.text.actionHigh.blueFrance.default,
            }}
          >
            Commentaire
          </Tag>
        )}
      </div>

      <div className="flex flex-col gap-1 fr-mt-1w">
        <LabelInfo
          label="Surface"
          icon="fr-icon-ruler-line"
          size="sm"
          info={`${parseFloat(surfParc).toFixed(2)} Ha`}
        />
        <LabelInfo label="Millésime" icon="fr-icon-calendar-line" size="sm" info={millesime} />

        {isBio && (
          <div className="fr-mt-1w">
            <b
              style={{
                backgroundColor: 'green',
                color: 'white',
                padding: '.5em',
                borderRadius: '25px',
              }}
            >
              BIO
            </b>
          </div>
        )}
      </div>

      {ownershipInfo.length > 0 && (
        <div className="fr-mt-2w">
          <Divider label="Exploitation" />
          {...ownershipInfo}
        </div>
      )}
    </div>
  )
}

export function renderPopupParcelle(
  codeGroup: string,
  surfParc: string,
  millesime: string,
  comment: string | undefined,
  isParcelleUnavailable: boolean,
  isBio?: boolean,
  isEditMode?: boolean,
  isOwnParcelle?: boolean
): HTMLDivElement {
  const container = document.createElement('div')
  const root = createRoot(container)
  root.render(
    <PopupParcelle
      codeGroup={codeGroup}
      surfParc={surfParc}
      millesime={millesime}
      comment={comment}
      isBio={isBio}
      isEditMode={isEditMode}
      isOwnParcelle={isOwnParcelle}
      isParcelleUnavailable={isParcelleUnavailable}
    />
  )
  return container
}
