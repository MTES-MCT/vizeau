import { fr } from '@codegouvfr/react-dsfr'

import TruncatedText from '../TruncatedText'
import MetasList, { MetasListProps } from '../MetasList'
import Checkbox from '@codegouvfr/react-dsfr/Checkbox'

export type CheckboxCardProps = {
  value: string
  title: string
  subtitle?: string
  iconId?: string
  metas?: MetasListProps['metas']
  isSelected?: boolean
  onCheck?: (value: string) => void
}

export default function CheckboxCard({
  value,
  title,
  subtitle,
  iconId,
  metas,
  isSelected = false,
  onCheck,
}: CheckboxCardProps) {
  return (
    <div
      className="flex flex-col gap-3 w-full fr-p-1w"
      style={{
        border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
        backgroundColor: fr.colors.decisions.background.default.grey.default,
      }}
    >
      <div className="flex gap-2">
        {iconId && (
          <div
            className="flex items-center justify-center w-fit fr-p-1w aspect-square"
            style={{
              backgroundColor: fr.colors.decisions.background.flat.blueFrance.default,
              color: fr.colors.decisions.text.inverted.grey.default,
            }}
          >
            <span className={`${iconId} fr-icon--lg aspect-square`} aria-hidden="true" />
          </div>
        )}

        <div className="flex flex-col gap-1 w-full">
          <div className="flex flex-col w-full">
            <TruncatedText maxLines={1} className="flex-1 fr-m-0 fr-text--lg font-bold">
              {title}
            </TruncatedText>

            {subtitle && (
              <TruncatedText
                maxLines={1}
                className="fr-mb-0 fr-text--sm"
                style={{ color: fr.colors.decisions.text.mention.grey.default }}
              >
                {subtitle}
              </TruncatedText>
            )}
          </div>
          {metas && metas.length > 0 && <MetasList metas={metas} size="xs" />}
        </div>
        <Checkbox
          options={[
            {
              label: '',
              nativeInputProps: {
                name: value,
                value: value,
                onChange: onCheck ? (e) => onCheck(e.target.value) : undefined,
                checked: isSelected,
              },
            },
          ]}
        />
      </div>
    </div>
  )
}
