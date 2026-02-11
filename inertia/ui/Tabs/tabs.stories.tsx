import { useState } from 'react'
import Tabs from './index.js'

const meta = {
  title: 'UI/Tabs',
  component: Tabs,
  tags: ['autodocs'],
  argTypes: {
    onTabChange: {
      action: 'tab changed',
      description:
        'Fonction appelée lors du changement d’onglet, reçoit la valeur de l’onglet sélectionné.',
    },
    tabsList: {
      control: 'object',
      description:
        'Liste des onglets à afficher, chaque onglet doit avoir une étiquette (label) et une valeur (value).',
    },
    selectedTab: {
      control: 'text',
      description:
        'Valeur de l’onglet actuellement sélectionné, doit correspondre à la valeur d’un des onglets de tabsList.',
    },
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
