import SearchWithFilters, { SearchWithFiltersProps } from './index.js'

const meta = {
  title: 'UI/SearchWithFilters',
  component: SearchWithFilters,
  tags: ['autodocs'],
  argTypes: {
    searchPlaceholder: {
      control: 'text',
      description: "Texte affiché dans le champ de recherche lorsqu'il est vide.",
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'Rechercher' },
      },
    },
    onSearchChange: {
      action: 'changed',
      description: 'Fonction appelée à chaque modification du champ de recherche.',
      table: {
        type: { summary: '(e: ChangeEvent<HTMLInputElement>) => void' },
      },
    },
    defaultSearchValue: {
      control: 'text',
      description: 'Valeur initiale du champ de recherche.',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: '' },
      },
    },
    children: {
      control: false,
      description:
        "Contenu des filtres affiché dans un panneau dépliable. Si absent, le bouton de filtres n'est pas affiché.",
      table: {
        type: { summary: 'ReactNode' },
      },
    },
  },
  args: {
    searchPlaceholder: 'Rechercher',
    defaultSearchValue: '',
  } as Partial<SearchWithFiltersProps>,
}

export default meta

export const Défaut = {}

export const AvecPlaceholderPersonnalisé = {
  args: {
    searchPlaceholder: 'Rechercher une exploitation…',
  },
}

export const AvecValeurParDéfaut = {
  args: {
    defaultSearchValue: 'Ferme du Moulin',
  },
}

export const AvecFiltres = {
  args: {
    children: (
      <div className="flex gap-4">
        <label>
          <span className="fr-text--sm">Type</span>
          <select className="fr-select">
            <option value="">Tous</option>
            <option value="bio">Bio</option>
            <option value="conventionnel">Conventionnel</option>
          </select>
        </label>
        <label>
          <span className="fr-text--sm">Région</span>
          <select className="fr-select">
            <option value="">Toutes</option>
            <option value="bretagne">Bretagne</option>
            <option value="normandie">Normandie</option>
          </select>
        </label>
      </div>
    ),
  },
}

export const AvecFiltresEtValeurParDéfaut = {
  args: {
    defaultSearchValue: 'Ferme du Moulin',
    searchPlaceholder: 'Rechercher une exploitation…',
    children: (
      <div className="flex gap-4">
        <label>
          <span className="fr-text--sm">Type</span>
          <select className="fr-select">
            <option value="">Tous</option>
            <option value="bio">Bio</option>
            <option value="conventionnel">Conventionnel</option>
          </select>
        </label>
      </div>
    ),
  },
}
