import { useState } from 'react'
import SingleSelectMenu, { SingleSelectMenuProps, OptionType } from './index'

const meta = {
  title: 'UI/SingleSelectMenu',
  component: SingleSelectMenu,
  tags: ['autodocs'],
  decorators: [
    (Story: React.ComponentType) => (
      <div style={{ height: '250px', maxWidth: '400px' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    label: {
      control: 'text',
      description: 'Libellé affiché au-dessus du sélecteur.',
    },
    hint: {
      control: 'text',
      description: 'Texte indicatif affiché sous le libellé.',
    },
    iconId: {
      control: 'text',
      description: 'Identifiant de l’icône à afficher à gauche du label de chaque option.',
    },
    placeholder: {
      control: 'text',
      description: "Texte affiché dans le déclencheur quand aucune option n'est sélectionnée.",
    },
    options: {
      control: 'object',
      description:
        'Liste des options. Une seule peut avoir `isSelected: true`.\n\nModèle :\n[\n  {\n    value: string | number,\n    label: string,\n    isSelected: boolean,\n    group?: string,\n  }\n]',
    },
    onChange: {
      control: false,
      description: "Callback appelé lors de la sélection d'une option.",
    },
  },
  args: {} as SingleSelectMenuProps<string>,
}

export default meta

export const Défaut = () => {
  const [options, setOptions] = useState<OptionType<string>[]>([
    { value: 'option1', label: 'Option 1', isSelected: false },
    { value: 'option2', label: 'Option 2', isSelected: false },
    { value: 'option3', label: 'Option 3', isSelected: false },
    { value: 'option4', label: 'Option 4', isSelected: false },
    { value: 'option5', label: 'Option 5', isSelected: false },
    { value: 'option6', label: 'Option 6', isSelected: false },
    { value: 'option7', label: 'Option 7', isSelected: false },
    { value: 'option8', label: 'Option 8', isSelected: false },
    { value: 'option9', label: 'Option 9', isSelected: false },
  ])

  const handleChange = (selected: OptionType<string>) => {
    setOptions((prev) => prev.map((opt) => ({ ...opt, isSelected: opt.value === selected.value })))
  }

  return <SingleSelectMenu label="Choisir une option" options={options} onChange={handleChange} />
}

export const AvecSélectionInitiale = () => {
  const [options, setOptions] = useState<OptionType<string>[]>([
    { value: 'option1', label: 'Option 1', isSelected: false },
    { value: 'option2', label: 'Option 2', isSelected: true },
    { value: 'option3', label: 'Option 3', isSelected: false },
  ])

  const handleChange = (selected: OptionType<string>) => {
    setOptions((prev) => prev.map((opt) => ({ ...opt, isSelected: opt.value === selected.value })))
  }

  return (
    <SingleSelectMenu
      label="Choisir une option"
      hint="Une option est présélectionnée"
      options={options}
      onChange={handleChange}
    />
  )
}

export const AvecIcônes = () => {
  const [options, setOptions] = useState<OptionType<string>[]>([
    { value: 'option1', label: 'Option 1', isSelected: false, iconId: 'fr-icon-warning-fill' },
    { value: 'option2', label: 'Option 2', isSelected: false, iconId: 'fr-icon-error-fill' },
    { value: 'option3', label: 'Option 3', isSelected: false, iconId: 'fr-icon-info-fill' },
  ])

  const handleChange = (selected: OptionType<string>) => {
    setOptions((prev) => prev.map((opt) => ({ ...opt, isSelected: opt.value === selected.value })))
  }

  return <SingleSelectMenu label="Choisir une option" options={options} onChange={handleChange} />
}

export const AvecGroupes = () => {
  const [options, setOptions] = useState<OptionType<string>[]>([
    { value: 'fr', label: 'France', isSelected: false, group: 'Europe' },
    { value: 'de', label: 'Allemagne', isSelected: false, group: 'Europe' },
    { value: 'es', label: 'Espagne', isSelected: false, group: 'Europe' },
    { value: 'ma', label: 'Maroc', isSelected: false, group: 'Afrique' },
    { value: 'sn', label: 'Sénégal', isSelected: false, group: 'Afrique' },
  ])

  const handleChange = (selected: OptionType<string>) => {
    setOptions((prev) => prev.map((opt) => ({ ...opt, isSelected: opt.value === selected.value })))
  }

  return <SingleSelectMenu label="Sélectionner un pays" options={options} onChange={handleChange} />
}

export const SansLibellé = () => {
  const [options, setOptions] = useState<OptionType<string>[]>([
    { value: 'option1', label: 'Option 1', isSelected: false },
    { value: 'option2', label: 'Option 2', isSelected: false },
    { value: 'option3', label: 'Option 3', isSelected: false },
  ])

  const handleChange = (selected: OptionType<string>) => {
    setOptions((prev) => prev.map((opt) => ({ ...opt, isSelected: opt.value === selected.value })))
  }

  return (
    <SingleSelectMenu placeholder="Filtrer par statut…" options={options} onChange={handleChange} />
  )
}

export const SansOptions = () => {
  return <SingleSelectMenu label="Choisir une option" options={[]} onChange={() => {}} />
}
