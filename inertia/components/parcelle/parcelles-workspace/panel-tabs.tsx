import { SegmentedControl } from '@codegouvfr/react-dsfr/SegmentedControl'

export type PanelTab = 'selection' | 'couches'

export type PanelTabsProps = {
  tab: PanelTab
  onTabChange: (tab: PanelTab) => void
  selectionCount: number
}

export default function PanelTabs({ tab, onTabChange, selectionCount }: PanelTabsProps) {
  return (
    <SegmentedControl
      small
      hideLegend
      legend="Contenu du panneau"
      segments={[
        {
          iconId: 'fr-icon-collage-line',
          label: `Sélection (${selectionCount})`,
          nativeInputProps: {
            checked: tab === 'selection',
            onChange: () => onTabChange('selection'),
          },
        },
        {
          iconId: 'fr-icon-stack-line',
          label: 'Couches',
          nativeInputProps: {
            checked: tab === 'couches',
            onChange: () => onTabChange('couches'),
          },
        },
      ]}
    />
  )
}
