import InputWithSelector, { InputWithSelectorProps, OptionType } from './index.js'
import { useState } from 'react'

const meta = {
  title: 'UI/InputWithSelector',
  component: InputWithSelector,
  tags: ['autodocs'],
  argTypes: {
    inputValue: {
      control: 'text',
      description: "Valeur actuelle de l'input",
    },
    options: {
      control: 'object',
      description: 'Liste des options avec leur état de sélection',
    },
    label: {
      control: 'text',
      description: 'Label du champ',
    },
    hintText: {
      control: 'text',
      description: "Texte d'aide sous le champ",
    },
  },
}

export default meta

/**
 * Story par défaut avec gestion complète de l'état.
 * Cliquez sur l'input pour ouvrir le dropdown et cochez/décochez les options.
 * L'état des options sélectionnées est affiché en temps réel.
 */
export const Défaut = (props: Partial<InputWithSelectorProps> & Record<string, any>) => {
  const [inputValue, setInputValue] = useState('')
  const [options, setOptions] = useState<OptionType[]>([
    { value: 'option1', label: 'Option 1', isSelected: false },
    { value: 'option2', label: 'Option 2', isSelected: false },
    { value: 'option3', label: 'Option 3', isSelected: false },
  ])

  const handleOptionsChange = (updatedOptions: OptionType[]) => {
    setOptions(updatedOptions)
    console.log('Options mises à jour:', updatedOptions)
    console.log(
      'Options sélectionnées:',
      updatedOptions.filter((opt) => opt.isSelected)
    )
  }

  return (
    <div>
      <InputWithSelector
        inputValue={inputValue}
        options={options}
        handleInputChange={setInputValue}
        onOptionsChange={handleOptionsChange}
        label="Sélectionnez des options"
        hintText="Cliquez pour ouvrir et cocher les options"
        {...props}
      />

      <div
        style={{ marginTop: '20px', padding: '15px', background: '#f0f0f0', borderRadius: '4px' }}
      >
        <h4 style={{ marginTop: 0 }}>État actuel :</h4>
        <p>
          <strong>Valeur de l'input:</strong> {inputValue || '(vide)'}
        </p>
        <p>
          <strong>Nombre d'options:</strong> {options.length}
        </p>
        <p>
          <strong>Options sélectionnées:</strong>{' '}
          {options
            .filter((opt) => opt.isSelected)
            .map((opt) => opt.label)
            .join(', ') || '(aucune)'}
        </p>
        <details>
          <summary style={{ cursor: 'pointer' }}>Voir l'état complet des options</summary>
          <pre style={{ marginTop: '10px', fontSize: '12px' }}>
            {JSON.stringify(options, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  )
}

/**
 * Story avec des options pré-sélectionnées.
 */
export const AvecOptionsPrésélectionnées = () => {
  const [inputValue, setInputValue] = useState('Recherche...')
  const [options, setOptions] = useState<OptionType[]>([
    { value: 'fruits', label: 'Fruits', isSelected: true },
    { value: 'legumes', label: 'Légumes', isSelected: false },
    { value: 'viandes', label: 'Viandes', isSelected: true },
    { value: 'poissons', label: 'Poissons', isSelected: false },
  ])

  return (
    <div>
      <InputWithSelector
        inputValue={inputValue}
        options={options}
        handleInputChange={setInputValue}
        onOptionsChange={setOptions}
        label="Catégories de produits"
        hintText="2 catégories déjà sélectionnées"
      />

      <div
        style={{ marginTop: '20px', padding: '15px', background: '#e8f5e9', borderRadius: '4px' }}
      >
        <p>
          <strong>Sélectionnées:</strong>{' '}
          {options
            .filter((opt) => opt.isSelected)
            .map((opt) => opt.label)
            .join(', ')}
        </p>
      </div>
    </div>
  )
}

/**
 * Story avec nombreuses options pour tester le défilement.
 */
export const AvecNombreusesOptions = () => {
  const [inputValue, setInputValue] = useState('')
  const [options, setOptions] = useState<OptionType[]>(
    Array.from({ length: 15 }, (_, i) => ({
      value: `option${i + 1}`,
      label: `Option ${i + 1}`,
      isSelected: i % 3 === 0, // Sélectionne toutes les 3 options
    }))
  )

  return (
    <InputWithSelector
      inputValue={inputValue}
      options={options}
      handleInputChange={setInputValue}
      onOptionsChange={setOptions}
      label="Liste avec défilement"
      hintText="15 options disponibles (max-height: 200px)"
    />
  )
}

/**
 * Story sans options pour tester le cas vide.
 */
export const SansOptions = () => {
  const [inputValue, setInputValue] = useState('')
  const [options, setOptions] = useState<OptionType[]>([])

  return (
    <InputWithSelector
      inputValue={inputValue}
      options={options}
      handleInputChange={setInputValue}
      onOptionsChange={setOptions}
      label="Aucune option disponible"
      hintText="Le dropdown affichera un message 'Aucune option'"
    />
  )
}
