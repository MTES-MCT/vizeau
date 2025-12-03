import CustomTag, { CustomTagProps } from './index.js'

const meta = {
  title: 'UI/CustomTag',
  component: CustomTag,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    iconId: { control: 'text' },
    size: {
      control: { type: 'select' },
      options: ['sm', 'xs'],
      defaultValue: 'sm'
    }
  },
  args: {
    label: 'Exemple de tag',
    iconId: 'fr-icon-add-circle-line',
    size: 'sm'
  } as CustomTagProps
}

export default meta

export const Défaut = {}

export const SansIcône = {
  args: {
    iconId: undefined
  }
}

export const TailleXS = {
  args: {
    size: 'xs'
  }
}

export const SansLibellé = {
  args: {
    label: undefined,
  },
}
