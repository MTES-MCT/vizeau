import { useState } from 'react'
import type { Meta } from '@storybook/react'
import CheckboxCard, { CheckboxCardProps } from './index.js'

const meta: Meta<typeof CheckboxCard> = {
  title: 'UI/CheckboxCard',
  component: CheckboxCard,
  tags: ['autodocs'],
  decorators: [
    (Story, context) => {
      const [isSelected, setIsSelected] = useState(false)
      return (
        <Story
          args={{
            ...context.args,
            isSelected,
            onCheck: () => setIsSelected((v) => !v),
          }}
        />
      )
    },
  ],
  argTypes: {
    value: {
      control: 'text',
      description:
        'La valeur associée à la carte, utilisée pour identifier la carte lors de la sélection',
    },
    title: { control: 'text', description: 'Titre principal affiché sur la carte' },
    subtitle: { control: 'text', description: 'Sous-titre optionnel affiché sous le titre' },
    iconId: {
      control: 'text',
      description: "Identifiant de l'icône DSFR à afficher (ex: fr-icon-collage-fill)",
    },
    metas: {
      control: 'object',
      description:
        'Liste de métadonnées affichées en bas de la carte, chacune avec un contenu et une icône optionnelle',
    },
    isSelected: { control: 'boolean', description: 'Indique si la carte est sélectionnée' },
    onCheck: {
      action: 'checked',
      description: 'Callback appelé lorsque la case est cochée ou décochée',
    },
  },
  args: {
    value: 'checkbox-card-1',
    title: 'Titre de la carte',
    subtitle: 'Sous-titre de la carte',
    iconId: 'fr-icon-submersion-line',
    metas: [
      { content: 'Meta 1', iconId: 'fr-icon-user-line' },
      { content: 'Meta 2', iconId: 'fr-icon-calendar-line' },
    ],
    isSelected: false,
    onCheck: () => {},
  } as CheckboxCardProps,
}

export default meta

export const Défaut = {}

export const SansIcone = {
  args: {
    iconId: undefined,
  },
}

export const SansSousTitre = {
  args: {
    subtitle: undefined,
  },
}

export const SansMetas = {
  args: {
    metas: undefined,
  },
}
