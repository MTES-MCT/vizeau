import { createRoot } from 'react-dom/client'
import { fr } from '@codegouvfr/react-dsfr'

import Divider from '~/ui/Divider'
import LabelInfo from '~/ui/LabelInfo'
import CustomTag from '~/ui/CustomTag'
import Tag from '@codegouvfr/react-dsfr/Tag'
import { getCultureByCode } from '~/functions/cultures-group'
import { ProjectJson } from '#types/models'
import TruncatedText from '~/ui/TruncatedText'

interface PopupParcelleProps {
  cultureCode?: string
  millesime: string
  comment?: string
  surfParc: string
  isParcelleUnavailable: boolean
  isBio?: boolean
  isEditMode?: boolean
  isOwnParcelle?: boolean
  projectsWithThisParcelle?: ProjectJson[]
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
        text: 'Rattachée à une exploitation',
        color: fr.colors.decisions.text.default.warning.default,
      }

  return (
    <div className="text-sm fr-mt-1w" style={{ color: config.color }}>
      <span className={`${config.icon} fr-mr-1w`} aria-hidden="true" />
      {config.text}
    </div>
  )
}

export default function PopupParcelle({
  cultureCode,
  surfParc,
  millesime,
  comment,
  isBio,
  projectsWithThisParcelle = [],
  isParcelleUnavailable = false,
  isEditMode = false,
  isOwnParcelle = false,
}: PopupParcelleProps) {
  const { label: cultureLabel, color: cultureColor } = getCultureByCode(cultureCode)

  return (
    <div
      style={{
        minWidth: '200px',
        backgroundColor: fr.colors.decisions.background.default.grey.default,
        fontFamily: 'Marianne, arial, sans-serif',
      }}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <CustomTag label={cultureLabel} color={cultureColor} size="sm" />
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
        {isEditMode && !isOwnParcelle && <StatusBadge isAvailable={!isParcelleUnavailable} />}
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
      {projectsWithThisParcelle?.length > 0 && (
        <div className="fr-mt-2w">
          <Divider label="Projets" />
          <ul>
            {projectsWithThisParcelle?.map((p) => (
              <li key={p.id}>
                <TruncatedText maxStringLength={40} hideTooltip>
                  {p.name}
                </TruncatedText>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export function renderPopupParcelle(
  cultureCode: string | undefined,
  surfParc: string,
  millesime: string,
  comment: string | undefined,
  isParcelleUnavailable: boolean,
  projectsWithThisParcelle?: ProjectJson[],
  isBio?: boolean,
  isEditMode?: boolean,
  isOwnParcelle?: boolean
): HTMLDivElement {
  const container = document.createElement('div')
  const root = createRoot(container)
  root.render(
    <PopupParcelle
      cultureCode={cultureCode}
      surfParc={surfParc}
      millesime={millesime}
      comment={comment}
      isBio={isBio}
      isEditMode={isEditMode}
      isOwnParcelle={isOwnParcelle}
      isParcelleUnavailable={isParcelleUnavailable}
      projectsWithThisParcelle={projectsWithThisParcelle}
    />
  )
  return container
}
