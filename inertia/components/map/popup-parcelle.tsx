import { createRoot } from 'react-dom/client'
import { fr } from '@codegouvfr/react-dsfr'

import GroupCulture from '~/components/groupe-culture-tag'

import Divider from '~/ui/Divider'

interface PopupParcelleProps {
  exploitation: { name: string }
  codeGroup: string
  millesime: string
  surfParc: string
  isAttributed?: boolean
  isEditMode?: boolean
  isOwnParcelle?: boolean
}

export default function PopupParcelle({
  exploitation,
  codeGroup,
  surfParc,
  millesime,
  isAttributed,
  isEditMode,
  isOwnParcelle,
}: PopupParcelleProps) {
  return (
    <div
      style={{
        minWidth: '200px',
        backgroundColor: fr.colors.decisions.background.default.grey.default,
      }}
    >
      <GroupCulture code_group={codeGroup} size="sm" />
      <div className="flex flex-col gap-3 fr-p-1w">
        <span className="text-sm">
          <strong>
            <span
              className="fr-icon fr-icon--sm fr-icon-ruler-line fr-mr-1w"
              style={{ color: fr.colors.decisions.artwork.major.blueEcume.default }}
            />
            Surface :
          </strong>{' '}
          {parseFloat(surfParc).toFixed(2)} Ha
        </span>
        <span className="text-sm">
          <strong>
            <span
              className="fr-icon fr-icon--sm fr-icon-calendar-line fr-mr-1w"
              style={{ color: fr.colors.decisions.artwork.major.blueEcume.default }}
            />
            Millésime :
          </strong>{' '}
          {millesime}
        </span>
      </div>
      {isEditMode && !isAttributed && (
        <div className="fr-mt-1w">
          <span
            className="fr-icon fr-icon-info-fill fr-mr-1w"
            style={{ color: fr.colors.decisions.text.default.info.default }}
          />
          Parcelle disponible
        </div>
      )}
      {exploitation?.name && (
        <>
          <Divider label="Exploitation" />
          {isEditMode && isAttributed && !isOwnParcelle && (
            <div className="text-sm fr-mt-1w">
              <span
                className="fr-icon fr-icon-warning-fill fr-mr-1w"
                style={{ color: fr.colors.decisions.text.default.warning.default }}
              />
              Parcelle déjà attribuée
            </div>
          )}
          <div
            className="flex fr-mt-2w fr-p-1w"
            style={{ backgroundColor: fr.colors.decisions.background.alt.grey.default }}
          >
            <span
              className="fr-icon-building-line"
              aria-hidden="true"
              style={{ color: fr.colors.decisions.text.actionHigh.blueFrance.default }}
            />
            <div className="fr-pl-2w">{exploitation.name}</div>
          </div>
        </>
      )}
    </div>
  )
}

export function renderPopupParcelle(
  exploitation: object,
  codeGroup: string,
  surfParc: string,
  millesime: string,
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
      isAttributed={isAttributed}
      isEditMode={isEditMode}
      isOwnParcelle={isOwnParcelle}
    />
  )
  return container
}
