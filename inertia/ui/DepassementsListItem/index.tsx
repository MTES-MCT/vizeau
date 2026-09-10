import { Link } from '@adonisjs/inertia/react'
import { fr } from '@codegouvfr/react-dsfr'

import MetasList, { MetasListProps } from '../MetasList'
import TruncatedText from '../TruncatedText'
import { AdditionnalInfos, AdditionalInfosProps } from '../ListItem'

import '../ListItem/list-item.css'

export type DepassementsListItemProps = {
  title: string
  metas: MetasListProps['metas']
  linkProps?: { href: string; preserveScroll?: boolean; preserveState?: boolean }
  priority?: 'primary' | 'secondary'
  depassementsAlerte?: number | null
  depassementsReglementaires?: number | null
  additionalInfos?: AdditionalInfosProps
}

/**
 * Shared card layout for a list item showing dépassements réglementaires/alerte
 * alongside its title and metas (used for both AAC and captage/installation lists).
 */
export default function DepassementsListItem({
  title,
  metas,
  linkProps,
  priority = 'primary',
  depassementsAlerte,
  depassementsReglementaires,
  additionalInfos,
}: DepassementsListItemProps) {
  const depassementsReglementairesValue = depassementsReglementaires ?? 0
  const depassementsAlerteValue = depassementsAlerte ?? 0

  const Wrapper = linkProps ? Link : 'div'
  const wrapperProps = linkProps ?? {}

  return (
    <Wrapper
      {...wrapperProps}
      className={`${linkProps ? 'list-item-effect' : ''} bg-transparent`}
      style={{
        backgroundColor:
          priority === 'primary'
            ? fr.colors.decisions.background.default.grey.default
            : fr.colors.decisions.background.alt.blueFrance.default,
      }}
    >
      <div
        className="fr-p-2w flex justify-between items-end flex-1 flex-wrap gap-1"
        style={{
          border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
        }}
      >
        <div className="flex flex-col gap-1">
          {additionalInfos && (
            <AdditionnalInfos
              iconId={additionalInfos.iconId}
              message={additionalInfos.message}
              alert={additionalInfos.alert}
            />
          )}
          <div className="flex-1 min-w-0">
            <TruncatedText maxLines={1} className="fr-m-0 fr-text--md font-bold">
              {title}
            </TruncatedText>
          </div>
          <MetasList size="sm" metas={metas} />
        </div>
        <div>
          {depassementsReglementairesValue > 0 && (
            <div className="flex items-center gap-1">
              <span
                className="fr-icon-error-line fr-icon--sm"
                style={{ color: fr.colors.decisions.text.default.error.default }}
              />
              dép. réglementaires :
              <strong style={{ color: fr.colors.decisions.text.default.error.default }}>
                {depassementsReglementairesValue}
              </strong>
            </div>
          )}

          {depassementsAlerteValue > 0 && (
            <div className="flex items-center gap-1">
              <span
                className="fr-icon-alert-line fr-icon--sm"
                style={{ color: fr.colors.decisions.text.default.warning.default }}
              />
              dép. avec alertes :
              <strong style={{ color: fr.colors.decisions.text.default.warning.default }}>
                {depassementsAlerteValue}
              </strong>
            </div>
          )}
        </div>
      </div>
    </Wrapper>
  )
}
