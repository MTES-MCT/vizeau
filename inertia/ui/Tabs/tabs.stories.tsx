import { useState } from 'react'
import Tabs from './index.js'

const meta = {
  title: 'UI/Tabs',
  component: Tabs,
  tags: ['autodocs'],
  argTypes: {
    onTabChange: { action: 'tab changed' },
    tabsList: { control: 'array' },
    selectedTab: { control: 'text' },
  },
}

export default meta

export const Défaut = () => {
  const [selectedValue, setSelectedValue] = useState('tab1')

  return (
    <Tabs
      tabsList={[
        { label: 'Tab 1', value: 'tab1' },
        { label: 'Tab 2', value: 'tab2' },
        { label: 'Tab 3', value: 'tab3' },
      ]}
      selectedTab={selectedValue}
      onTabChange={(value) => setSelectedValue(value)}
    />
  )
}
