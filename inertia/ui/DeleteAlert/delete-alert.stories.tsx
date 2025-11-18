import DeleteAlert, { DeleteAlertProps } from './index'

const meta = {
  title: 'UI/DeleteAlert',
  component: DeleteAlert,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
    onDelete: { action: 'deleted' },
  },
  args: {
    title: 'Confirmer la suppression',
    description: 'Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.',
  } as DeleteAlertProps,
}

export default meta

export const Défaut = {}

export const Small = {
  args: {
    size: 'sm',
  },
}

export const WithoutDescription = {
  args: {
    description: undefined,
  },
}
