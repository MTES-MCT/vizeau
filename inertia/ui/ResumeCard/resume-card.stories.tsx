import { fr } from '@codegouvfr/react-dsfr'
import ResumeCard, { ResumeCardProps } from './index.js'

const metaArgs: ResumeCardProps = {
  title: 'Title',
  label: 'Label',
  value: 'Value',
  size: 'md',
  priority: 'primary',
  color: fr.colors.decisions.text.label.blueFrance.default,
  iconId: 'fr-icon-information-fill',
  hint: 'Hint text',
}

const meta = {
  title: 'UI/ResumeCard',
  component: ResumeCard,
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
    },
    label: {
      control: 'text',
    },
    value: {
      control: 'text',
    },
    size: {
      control: { type: 'select', options: ['sm', 'md'] },
    },
    priority: {
      control: { type: 'select', options: ['primary', 'secondary'] },
    },
    color: {
      control: 'color',
    },
    iconId: {
      control: 'text',
    },
    hint: {
      control: 'text',
    },
  },
  args: metaArgs,
}

export default meta

export const Défaut = {}

export const PetiteTaille = {
  args: {
    size: 'sm',
  },
}

export const Secondaire = {
  args: {
    priority: 'secondary',
  },
}

export const SansLabel = {
  args: {
    label: undefined,
  },
}

export const AvecHint = {
  args: {
    hint: 'Ceci est un hint pour expliquer la valeur affichée.',
  },
}

export const SansIcone = {
  args: {
    iconId: undefined,
  },
}
