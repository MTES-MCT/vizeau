import Timeline, { TimelineProps } from './index'
import { fr } from '@codegouvfr/react-dsfr'
import type { StoryObj } from '@storybook/react'
import { useEffect, useState } from 'react'

const timelineData = [
  {
    content: (
      <div>
        <strong>Étape 1</strong>
        <p className="text-gray-600 text-sm mt-1">Premier élément de la timeline</p>
      </div>
    ),
  },
  {
    content: (
      <div>
        <strong>Étape 2</strong>
        <p className="text-gray-600 text-sm mt-1">Deuxième élément avec du contenu</p>
      </div>
    ),
  },
  {
    content: (
      <div>
        <strong>Étape 3</strong>
        <p className="text-gray-600 text-sm mt-1">Troisième élément important</p>
      </div>
    ),
  },
  {
    content: (
      <div>
        <strong>Étape 4</strong>
        <p className="text-gray-600 text-sm mt-1">Quatrième élément</p>
      </div>
    ),
  },
  {
    content: (
      <div>
        <strong>Étape 5</strong>
        <p className="text-gray-600 text-sm mt-1">Cinquième élément</p>
      </div>
    ),
  },
  {
    content: (
      <div>
        <strong>Étape 6</strong>
        <p className="text-gray-600 text-sm mt-1">Sixième élément</p>
      </div>
    ),
  },
  {
    content: (
      <div>
        <strong>Étape 7</strong>
        <p className="text-gray-600 text-sm mt-1">Septième élément</p>
      </div>
    ),
  },
  {
    content: (
      <div>
        <strong>Étape 8</strong>
        <p className="text-gray-600 text-sm mt-1">Huitième élément</p>
      </div>
    ),
  },
  {
    content: (
      <div>
        <strong>Étape 9</strong>
        <p className="text-gray-600 text-sm mt-1">Neuvième élément</p>
      </div>
    ),
  },
  {
    content: (
      <div>
        <strong>Étape 10</strong>
        <p className="text-gray-600 text-sm mt-1">Dixième élément</p>
      </div>
    ),
  },
  {
    content: (
      <div>
        <strong>Étape 11</strong>
        <p className="text-gray-600 text-sm mt-1">Onzième élément</p>
      </div>
    ),
  },
]

const meta = {
  title: 'UI/Timeline',
  component: Timeline,
  tags: ['autodocs'],
  argTypes: {
    items: {
      control: 'object',
      description:
        'Liste des éléments à afficher dans la timeline. Chaque élément doit contenir au minimum la propriété content (ReactNode) et optionnellement dotColor (string).',
      table: {
        type: { summary: 'TimelineItem[]' },
        defaultValue: { summary: '[]' },
      },
    },
    maxVisible: {
      control: 'number',
      description: 'Nombre maximum d\'éléments visibles avant affichage du bouton "Voir plus".',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: 'null' },
      },
    },
    onShowMore: {
      control: 'function',
      description:
        'Callback optionnel déclenché lors du clic sur "Voir plus". Permet de gérer le chargement ou l\'affichage de plus d\'éléments depuis le composant parent.',
      table: {
        type: { summary: '() => Promise<void>' },
        defaultValue: { summary: 'null' },
      },
    },
    hasMore: {
      control: 'boolean',
      description:
        "Indique s'il y a plus d'éléments à charger. Utilisé uniquement en mode externe avec onShowMore.",
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
  },
  args: {
    items: timelineData,
    maxVisible: 5,
  } as TimelineProps,
}

export default meta

export const Défaut = {}

export const AvecCouleursCustom = {
  args: {
    items: [
      {
        content: (
          <div>
            <strong>Étape 1</strong>
            <p className="text-gray-600 text-sm mt-1">Premier élément de la timeline</p>
          </div>
        ),
        dotColor: fr.colors.decisions.background.flat.blueFrance.default,
      },
      {
        content: (
          <div>
            <strong>Étape 2</strong>
            <p className="text-gray-600 text-sm mt-1">Deuxième élément avec du contenu</p>
          </div>
        ),
        dotColor: fr.colors.decisions.background.flat.warning.default,
      },
      {
        content: (
          <div>
            <strong>Étape 3</strong>
            <p className="text-gray-600 text-sm mt-1">Troisième élément important</p>
          </div>
        ),
        dotColor: fr.colors.decisions.background.flat.success.default,
      },
      {
        content: (
          <div>
            <strong>Étape 4</strong>
            <p className="text-gray-600 text-sm mt-1">Quatrième élément</p>
          </div>
        ),
        dotColor: fr.colors.decisions.background.flat.error.default,
      },
    ],
    maxVisible: 5,
  },
}

export const AvecContenuLong = {
  args: {
    items: [
      {
        content: (
          <div>
            <strong>Étape 1</strong>
            <p className="text-gray-600 text-sm mt-1">
              Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque
              laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi
              architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas
              sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione
              voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit
              amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut
              labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis
              nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea
              commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit
              esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas
              nulla pariatur?
            </p>
          </div>
        ),
      },
      {
        content: (
          <div>
            <strong>Étape 2</strong>
            <p className="text-gray-600 text-sm mt-1">
              Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque
              laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi
              architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas
              sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione
              voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit
              amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut
              labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis
              nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea
              commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit
              esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas
              nulla pariatur?
            </p>
          </div>
        ),
      },
      {
        content: (
          <div>
            <strong>Étape 3</strong>
            <p className="text-gray-600 text-sm mt-1">
              Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque
              laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi
              architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas
              sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione
              voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit
              amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut
              labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis
              nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea
              commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit
              esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas
              nulla pariatur?
            </p>
          </div>
        ),
      },
      {
        content: (
          <div>
            <strong>Étape 4</strong>
            <p className="text-gray-600 text-sm mt-1">
              Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque
              laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi
              architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas
              sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione
              voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit
              amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut
              labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis
              nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea
              commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit
              esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas
              nulla pariatur?
            </p>
          </div>
        ),
      },
    ],
  },
}

export const SansLimite = {
  args: {
    items: timelineData,
    maxVisible: undefined,
  },
}

export const UnSeulItem = {
  args: {
    items: [timelineData[0]],
    maxVisible: 1,
  },
}

export const Vide = {
  args: {
    items: [],
    maxVisible: 5,
  },
}

export const AvecPagination = {
  args: {
    items: timelineData.slice(0, 5),
    maxVisible: undefined,
    hasMore: true,
  },
  render: (args: TimelineProps) => {
    const [items, setItems] = useState(args.items)

    useEffect(() => {
      setItems(args.items)
    }, [args.items])

    const onShowMore = () => {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          setItems((prev) => [
            ...prev,
            {
              content: (
                <div>
                  <strong>Nouvelle étape</strong>
                  <p className="text-gray-600 text-sm mt-1">Elément de la nouvelle page</p>
                </div>
              ),
            },
          ])
          resolve()
        }, 400)
      })
    }

    return <Timeline {...args} items={items} onShowMore={onShowMore} />
  },
} satisfies StoryObj<typeof Timeline>
