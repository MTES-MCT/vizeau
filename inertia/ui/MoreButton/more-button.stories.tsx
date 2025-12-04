import MoreButton, { MoreButtonProps } from './index.js'
import { Tooltip } from '@codegouvfr/react-dsfr/Tooltip'

const meta = {
  title: 'UI/MoreButton',
  component: MoreButton,
  tags: ['autodocs'],
  argTypes: {
    actions: {
      description:
        'Liste des actions disponibles dans le menu déroulant du bouton "Plus d\'options". Chaque action doit contenir un label, une fonction onClick, et peut optionnellement inclure un iconId et un indicateur isCritical.',
      control: 'object',
    },
  },
  args: {
    actions: [
      {
        label: 'Modifier',
        iconId: 'fr-icon-edit-line',
        onClick: () => alert('Modifier action clicked'),
      },
      {
        label: <Tooltip title="Impossible de dupliquer cet élément">Dupliquer</Tooltip>,
        iconId: 'fr-icon-stack-line',
        isDisabled: true,
        onClick: () => alert('Dupliquer action clicked'),
      },
      {
        label: 'Supprimer',
        iconId: 'fr-icon-delete-bin-line',
        isCritical: true,
        onClick: () => alert('Supprimer action clicked'),
      },
    ],
  } as MoreButtonProps,
}

export default meta

export const Défaut = {}
