import { createRoot } from 'react-dom/client'
import { fr } from '@codegouvfr/react-dsfr'

import GroupCulture from '~/components/groupe-culture-tag'
import Divider from '~/ui/Divider'
import LabelInfo from '~/ui/LabelInfo'

interface PopupParcelleProps {
  exploitation?: { name?: string }
  codeGroup: string
  millesime: string
  surfParc: string
  isBio?: boolean
  isAttributed?: boolean
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
  exploitation,
  codeGroup,
  surfParc,
  millesime,
  isBio,
  isAttributed = false,
  isEditMode = false,
  isOwnParcelle = false,
}: PopupParcelleProps) {
  const showAvailableStatus = isEditMode && !isAttributed
  const showAttributedStatus = isEditMode && isAttributed && !isOwnParcelle
  const hasExploitation = exploitation?.name

  return (
    <div
      style={{
        minWidth: '200px',
        backgroundColor: fr.colors.decisions.background.default.grey.default,
      }}
    >
      <GroupCulture code_group={codeGroup} size="sm" />

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

      {showAvailableStatus && <StatusBadge isAvailable />}

      {hasExploitation && exploitation?.name && (
        <div className="fr-mt-2w">
          <Divider label="Exploitation" />
          {showAttributedStatus && <StatusBadge isAvailable={false} />}
          <ExploitationInfo name={exploitation.name} />
        </div>
      )}
    </div>
  )
}

export function renderPopupParcelle(
  exploitation: PopupParcelleProps['exploitation'],
  codeGroup: string,
  surfParc: string,
  millesime: string,
  isBio?: boolean,
  isAttributed?: boolean,
  isEditMode?: boolean,
  isOwnParcelle?: boolean
): HTMLDivElement {
  const container = document.createElement('div')
  const root = createRoot(container)
  root.render(
    <PopupParcelle
      exploitation={exploitation}
      codeGroup={codeGroup}
      surfParc={surfParc}
      millesime={millesime}
      isBio={isBio}
      isAttributed={isAttributed}
      isEditMode={isEditMode}
      isOwnParcelle={isOwnParcelle}
    />
  )
  return container
}
