import { fr } from '@codegouvfr/react-dsfr'
import { OptionType } from './index'

export type SingleSelectItemProps<T extends string | number> = {
  item: OptionType<T>
  iconId?: string
  isLast?: boolean
  onSelect: (value: T) => void
}

export default function SingleSelectItem<T extends string | number>({
  item,
  iconId,
  isLast,
  onSelect,
}: SingleSelectItemProps<T>) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item.value)}
      className="flex items-center justify-between fr-p-2v w-full"
      style={{
        borderBottom: isLast
          ? 'none'
          : `solid 1px ${fr.colors.decisions.border.default.grey.default}`,
        color: item.isSelected
          ? fr.colors.decisions.text.actionHigh.blueFrance.default
          : fr.colors.decisions.text.default.grey.default,
        textAlign: 'left',
        cursor: 'pointer',
      }}
      role="option"
      aria-selected={item.isSelected}
    >
      <div className="flex items-center gap-2">
        {iconId && <span className={`${iconId} fr-icon--sm flex items-center`} />}
        <span>{item.label}</span>
      </div>
      {item.isSelected && (
        <span
          className="fr-icon-check-line fr-icon--sm"
          aria-hidden="true"
          style={{ color: fr.colors.decisions.text.actionHigh.blueFrance.default }}
        />
      )}
    </button>
  )
}
