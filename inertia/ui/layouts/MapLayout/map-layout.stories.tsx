import MapLayout, { MapLayoutProps } from './index.js'

import { Button } from '@codegouvfr/react-dsfr/Button'

const meta = {
  title: 'Ui/layouts/MapLayout',
  component: MapLayout,
  tags: ['autodocs'],
  decorators: [
    (
      Story: import('@storybook/react').StoryFn,
      context: import('@storybook/react').StoryContext
    ) => (
      <div className="h-screen overflow-hidden" style={{ padding: 0, width: '100%' }}>
        {Story(context.args, context)}
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          "Pour un test optimal de ce layout, il est recommandé d'utiliser le mode 'Canvas' en plein écran.",
      },
    },
  },
  argTypes: {
    pageName: { control: 'text' },
    headerAdditionalContent: { control: false },
    leftContent: { control: false },
    rightContent: { control: false },
    map: { control: false },
  },
  args: {
    pageName: 'Tableau de bord',
    headerAdditionalContent: (
      <div className="w-full flex flex-wrap justify-end gap-2">
        <Button size="small" priority="secondary">
          Action 1
        </Button>
        <Button size="small">Action 2</Button>
      </div>
    ),
    leftContent: <div>Contenu de la barre latérale gauche</div>,
    rightContent: <div>Contenu de la barre latérale droite</div>,
    map: null,
  } as MapLayoutProps,
}

export default meta

export const Défaut = {}

export const SansContenuAdditionnelDansLEntête = {
  args: {
    headerAdditionalContent: null,
  },
}
