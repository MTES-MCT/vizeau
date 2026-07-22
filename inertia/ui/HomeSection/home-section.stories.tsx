import HomeSection, { HomeSectionProps } from './index.js'

const meta = {
  title: 'UI/HomeSection',
  component: HomeSection,
  tags: ['autodocs'],
  argTypes: {
    background: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'default'],
    },
    title: { control: 'text' },
    subtitle: { control: 'text' },
    illustration: { control: 'text' },
    illustrationAlt: { control: 'text' },
    illustrationSide: {
      control: { type: 'select' },
      options: ['left', 'right'],
    },
    children: { control: 'text' },
  },
  args: {
    background: 'primary',
    title: 'Titre de la section',
    subtitle: 'Sous-titre de la section',
    illustration: '/placeholder-illustrations/exploitations.png',
    illustrationSide: 'right',
    illustrationAlt: "Description de l'illustration",
    children: 'Contenu de la section',
  } as HomeSectionProps,
}

export default meta

export const Défaut = {}

export const SansIllustration = {
  args: {
    illustration: undefined,
  },
}

export const AvecIllustrationÀGauche = {
  args: {
    illustration: '/placeholder-illustrations/exploitations.png',
    illustrationSide: 'left',
  },
}

export const AvecFondSecondaire = {
  args: {
    background: 'secondary',
  },
}
