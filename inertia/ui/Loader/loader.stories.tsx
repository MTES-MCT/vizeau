import Loader, { LoaderProps } from './index.js'

const meta = {
  title: 'UI/Loader',
  component: Loader,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'radio', options: ['sm', 'md', 'lg'] },
  },
  args: {
    size: 'md',
  } as LoaderProps,
}

export default meta

export const Défaut = {}

export const Petit = {
  args: {
    size: 'sm',
  },
}

export const Grand = {
  args: {
    size: 'lg',
  },
}
