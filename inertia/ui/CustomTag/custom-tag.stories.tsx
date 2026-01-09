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
      options: ['sm', 'md'],
      defaultValue: 'sm',
    },
    color: { control: 'color' },
  },
  args: {
    label: 'Exemple de tag',
    iconId: 'fr-icon-add-circle-line',
    size: 'sm',
  } as CustomTagProps,
}

export default meta

export const Défaut = {}

export const AvecIcônePersonnalisée = {
  args: {
    iconId: undefined,
    iconPath: '/cultures-pictos/light/groupe-1.png',
  },
}

export const AvecCouleurPersonnalisée = {
  args: {
    color: '#FFD700',
  },
}

export const SansIcône = {
  args: {
    iconId: undefined,
  },
}

export const TailleMD = {
  args: {
    size: 'md',
  },
}

export const SansLibellé = {
  args: {
    label: undefined,
  },
}
