import Tab from './tab'

export type TabsProps = {
  tabsList: { label: string; value: string }[]
  selectedTab: string
  onTabChange: (value: string) => void
}

export default function Tabs({ tabsList, selectedTab, onTabChange }: TabsProps) {
  return (
    <div className="flex w-fill">
      {tabsList.map((tab) => (
        <Tab
          key={tab.value}
          label={tab.label}
          isActive={tab.value === selectedTab}
          onTabChange={() => onTabChange(tab.value)}
        />
      ))}
    </div>
  )
}
