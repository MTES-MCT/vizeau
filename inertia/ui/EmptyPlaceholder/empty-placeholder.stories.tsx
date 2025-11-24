import EmptyPlaceholder, { EmptyPlaceholderProps } from './index'
import Ecosystem from '@codegouvfr/react-dsfr/picto/Ecosystem'

const meta = {
  title: 'UI/EmptyPlaceholder',
  component: EmptyPlaceholder,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    pictogram: { control: 'object' },
    illustrativeIcon: { control: 'text' },
    hint: { control: 'text' },
    buttonLabel: { control: 'text' },
    actionAriaLabel: { control: 'text' },
    buttonIcon: { control: 'text' },
    handleClick: { action: 'clicked' },
  },
  args: {
    label: 'Aucun élément à afficher',
    pictogram: Ecosystem,
    hint: 'Il n’y a actuellement aucun élément disponible dans cette section.',
    buttonLabel: 'Ajouter un élément',
    actionAriaLabel: 'Ajouter un élément',
    buttonIcon: 'fr-icon-add-circle-line',
    illustrativeIcon: 'fr-icon-add',
  } as EmptyPlaceholderProps,
}

export default meta

export const Défaut = {}

export const AvecIllustrativeIcon = {
  args: {
    pictogram: undefined,
    illustrativeIcon: 'fr-icon-heavy-showers-line',
  },
}

export const SansBouton = {
  args: {
    buttonLabel: undefined,
    actionAriaLabel: undefined,
    buttonIcon: undefined,
    handleClick: undefined,
  },
}

export const SansIllustration = {
  args: {
    pictogram: undefined,
    illustrativeIcon: undefined,
  },
}
