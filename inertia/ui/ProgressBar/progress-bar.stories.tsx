import ProgressBar, { ProgressBarProps } from './index.js'
import { fr } from '@codegouvfr/react-dsfr'

const meta = {
  title: 'UI/ProgressBar',
  component: ProgressBar,
  tags: ['autodocs'],
  argTypes: {
    value: { control: 'number', description: 'La valeur actuelle de la progression' },
    total: { control: 'number', description: 'La valeur totale pour atteindre 100%' },
    unit: { control: 'text', description: "L'unité de mesure (optionnel)" },
    size: {
      control: 'select',
      options: ['md', 'sm'],
      description: 'La taille de la barre de progression',
    },
    progressColor: {
      control: 'color',
      description: 'La couleur de la barre de progression (optionnel)',
    },
  },
  args: {
    value: 30,
    total: 100,
    unit: 'items',
    size: 'md',
    progressColor: undefined,
  } as ProgressBarProps,
}

export default meta

export const Défaut = {}

export const PetiteTaille = {
  args: {
    size: 'sm',
  },
}

export const SansUnité = {
  args: {
    unit: undefined,
  },
}

export const AvecCouleurPersonnalisée = {
  args: {
    progressColor: fr.colors.decisions.background.actionHigh.greenArchipel.hover,
  },
}

export const ValeurEtTotalNuls = {
  args: {
    value: undefined,
    total: undefined,
  },
}

export const ValeurMaximale = {
  args: {
    value: 100,
    total: 100,
  },
}

export const ValeurDépassantLeTotal = {
  args: {
    value: 150,
    total: 100,
  },
}
