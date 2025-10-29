import Example from './index'

const meta = {
  title: 'Composant/Test',
  component: Example,
  tags: ['autodocs'],
  argTypes: {
    text: {
      control: 'text',
      description: 'Texte affiché. Type : <string>',
    },
  },
  args: {
    text: 'Est-ce que ça fonctionne ⁉️',
  },
}

export default meta

export const Défaut = {}

export const SansTexte = {
  args: {
    text: '',
  },
}

export const LongTexte = {
  args: {
    text: 'Une fois rien, c’est rien ; deux fois rien, ce n’est pas beaucoup, mais pour trois fois rien, on peut déjà s’acheter quelque chose, et pour pas cher. Alors maintenant si vous multipliez trois fois rien par trois fois rien, rien multiplié par rien égale rien, trois multiplié par trois égale neuf, ça fait rien de neuf.',
  },
}
