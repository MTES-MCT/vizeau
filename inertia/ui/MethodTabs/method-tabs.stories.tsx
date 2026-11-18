import { useState } from 'react'
import MethodTabs, { Method } from './index.js'

const meta = {
  title: 'UI/MethodTabs',
  component: MethodTabs,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          "Onglets de choix d'une méthode, basés sur le SegmentedControl DSFR. Une méthode « à venir » est grisée : elle ne peut être ni cliquée ni sélectionnée au clavier.",
      },
    },
  },
}

export default meta

type Value = 'carte' | 'pacage' | 'coordonnees' | 'exploitation'

const methods: Method<Value>[] = [
  { value: 'carte', label: 'Carte', iconId: 'fr-icon-cursor-line' },
  { value: 'pacage', label: 'PACAGE', iconId: 'fr-icon-hashtag', isUpcoming: true },
  {
    value: 'coordonnees',
    label: 'Coordonnées',
    iconId: 'fr-icon-map-pin-2-line',
    isUpcoming: true,
  },
  { value: 'exploitation', label: 'Exploitation', iconId: 'fr-icon-team-line', isUpcoming: true },
]

export const Défaut = () => {
  const [value, setValue] = useState<Value>('carte')
  return (
    <div style={{ maxWidth: '22rem' }}>
      <MethodTabs methods={methods} value={value} onChange={setValue} legend="Méthode d'ajout" />
    </div>
  )
}

export const ToutesDisponibles = () => {
  const [value, setValue] = useState<Value>('carte')
  return (
    <MethodTabs
      methods={methods.map((method) => ({ ...method, isUpcoming: false }))}
      value={value}
      onChange={setValue}
      legend="Méthode d'ajout"
    />
  )
}
