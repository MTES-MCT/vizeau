import Loader, { LoaderProps } from './index.js'

const meta = {
  title: 'UI/Loader',
  component: Loader,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'radio', options: ['sm', 'md', 'lg'] },
    type: { control: 'radio', options: ['spinner', 'dots'] },
  },
  args: {
    size: 'md',
  } as LoaderProps,
}

export default meta

export const DéfautSpinner = {}
export const DéfautDots = {
  args: {
    type: 'dots',
  },
}

export const PetitSpinner = {
  args: {
    size: 'sm',
  },
}

export const PetitDots = {
  args: {
    size: 'sm',
    type: 'dots',
  },
}

export const GrandSpinner = {
  args: {
    size: 'lg',
  },
}

export const GrandDots = {
  args: {
    size: 'lg',
    type: 'dots',
  },
}
