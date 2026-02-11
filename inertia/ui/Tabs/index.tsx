import Tab from './tab'

export type TabsProps = {
  tabsList: { label: string; value: string; isDisabled?: boolean }[]
  selectedTab: string
  onTabChange: (value: string) => void
}

export default function Tabs({ tabsList, selectedTab, onTabChange }: TabsProps) {
  return (
    <div role="tablist" className="flex w-full">
      {tabsList.map((tab) => (
        <Tab
          key={tab.value}
          label={tab.label}
          disabled={tab.isDisabled}
          isActive={tab.value === selectedTab}
          onTabChange={() => onTabChange(tab.value)}
        />
      ))}
    </div>
  )
}
