import Loader, { LoaderProps } from './index.js'

const meta = {
  title: 'UI/Loader',
  component: Loader,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'radio', options: ['sm', 'md', 'lg'] },
  },
  args: {
    // Définir les args par défaut si nécessaire
  } as LoaderProps,
}

export default meta

export const Défaut = {}
