import { Checkbox } from '@codegouvfr/react-dsfr/Checkbox'
import { Tooltip } from '@codegouvfr/react-dsfr/Tooltip'

export type LegendItemProps = {
  hint?: string
  label: string
  color?: string
  checked: boolean
  disabled?: boolean
  onChange: () => void
}

export default function LegendItem({
  hint,
  label,
  color,
  checked,
  disabled,
  onChange,
}: LegendItemProps) {
  return (
    <Checkbox
      className="fr-mb-0"
      small
      options={[
        {
          label: (
            <div className="flex items-center gap-2">
              {color && <div className={`w-3 h-3 rounded-full flex-shrink-0 ${color}`} />}
              <span className="fr-text--sm fr-mb-0 flex items-center gap-1">
                {label}
                {hint && <Tooltip kind="hover" title={hint} />}
              </span>
            </div>
          ),
          nativeInputProps: {
            name: label.toLowerCase(),
            value: label.toLowerCase(),
            checked: checked,
            disabled: disabled,
            onChange: onChange,
          },
        },
      ]}
    />
  )
}
