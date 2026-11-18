import { useId } from 'react'
import { SegmentedControl, SegmentedControlProps } from '@codegouvfr/react-dsfr/SegmentedControl'
import type { FrIconClassName, RiIconClassName } from '@codegouvfr/react-dsfr'

export type Method<T extends string> = {
  value: T
  label: string
  iconId: FrIconClassName | RiIconClassName
  isUpcoming?: boolean
}

export type MethodTabsProps<T extends string> = {
  methods: Method<T>[]
  value: T
  onChange: (value: T) => void
  legend: string
}

export default function MethodTabs<T extends string>({
  methods,
  value,
  onChange,
  legend,
}: MethodTabsProps<T>) {
  const name = useId()
  const upcomingLabels = methods.filter((method) => method.isUpcoming).map(({ label }) => label)

  // Le DSFR attend un tuple de 1 à 5 segments, que TypeScript ne déduit pas d'un map
  const segments = methods.map((method): SegmentedControlProps.SegmentWithIcon => ({
    iconId: method.iconId,
    label: (
      <>
        {method.label}
        {method.isUpcoming && <span className="fr-sr-only"> (à venir)</span>}
      </>
    ),
    nativeInputProps: {
      value: method.value,
      checked: method.value === value,
      disabled: method.isUpcoming,
      onChange: () => onChange(method.value),
    },
  })) as unknown as SegmentedControlProps.Segments

  return (
    <div className="flex flex-col gap-1">
      <SegmentedControl
        name={name}
        small
        hideLegend
        legend={legend}
        segments={segments}
        classes={{
          'root': 'w-full',
          'elements': 'grid! grid-cols-2 w-full',
          'element-each': 'min-w-0',
          'element-each__label': 'w-full! justify-center px-1! text-xs! before:mr-1!',
        }}
      />
      {upcomingLabels.length > 0 && (
        <p className="fr-text--xs fr-text-mention--grey fr-m-0" aria-hidden="true">
          À venir : {upcomingLabels.join(', ')}
        </p>
      )}
    </div>
  )
}
