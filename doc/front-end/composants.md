# Composants

## `ui/` ou `components/` ?

|                        | `inertia/ui/`                                                    | `inertia/components/`                                                    |
| ---------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Nature                 | Composants génériques, réutilisables tels quels                  | Composants métier, propres à Viz'eau                                     |
| Connaissance du métier | Aucune : ils reçoivent des libellés, des couleurs, des callbacks | Connaissent les exploitations, AAC, parcelles, projets…                  |
| Appels au serveur      | Non                                                              | Oui (`router`, `useForm`, `urlFor`…)                                     |
| Types `Data.*`         | Non                                                              | Oui                                                                      |
| Story Storybook        | Obligatoire                                                      | Non                                                                      |
| Organisation           | Un dossier par composant (`ui/TagsList/index.tsx`)               | Un dossier par domaine (`components/exploitations/`, `components/map/`…) |

Exemple : `ui/TagsList` affiche une liste de libellés colorés, sans savoir de quoi il s'agit. `components/exploitations/exploitations-list.tsx` récupère les tags d'une exploitation et les lui passe.

Un bon test : si le composant pourrait servir tel quel dans une autre application de l'État, il va dans `ui/`.

Exception : les layouts (`ui/layouts/`) sont rangés dans `ui/` mais connaissent l'application (navigation, utilisateur connecté, recherche globale).

## Le DSFR

Viz'eau est un service de l'État : son interface suit le [Système de design de l'État](https://www.systeme-de-design.gouv.fr/) (DSFR), via la librairie [`@codegouvfr/react-dsfr`](https://components.react-dsfr.codegouv.studio/).
Avant de créer un composant, vérifier que le DSFR n'en propose pas déjà un : bouton, alerte, onglets, fil d'Ariane, pagination, tableau, modale…

```tsx
import { Button } from '@codegouvfr/react-dsfr/Button'
import { Alert } from '@codegouvfr/react-dsfr/Alert'

;<Button iconId="fr-icon-add-line" linkProps={{ href: '/exploitations/creation' }}>
  Ajouter une exploitation agricole
</Button>
```

### Couleurs

Ne jamais écrire une couleur en dur : utiliser les couleurs du DSFR via `fr.colors`, qui s'adaptent automatiquement au thème clair ou sombre.

```tsx
import { fr } from '@codegouvfr/react-dsfr'

const borderColor = fr.colors.decisions.border.default.grey.default

<div style={{ backgroundColor: fr.colors.decisions.background.alt.blueFrance.default }} />
```

Les noms suivent la logique du DSFR (`decisions.<usage>.<variante>.<couleur>.<état>`). L'autocomplétion de l'éditeur est le moyen le plus simple de s'y retrouver.

### Icônes et pictogrammes

- **Icônes** : passées en prop (`iconId="fr-icon-add-line"`) ou en classe CSS. La liste est sur le [site du DSFR](https://www.systeme-de-design.gouv.fr/fondamentaux/icone).
- **Pictogrammes** (grandes illustrations) : importés comme des composants, par exemple `import LocationFrance from '@codegouvfr/react-dsfr/picto/LocationFrance'`.

Pour alléger le CSS, seules les icônes utilisées dans le code sont incluses. La liste est recalculée par `npx react-dsfr update-icons`, lancé automatiquement par `npm run dev`. **Après avoir utilisé une nouvelle icône, relancer `npm run dev`**, sinon elle ne s'affiche pas.

## DSFR et Tailwind

Les deux s'utilisent ensemble, chacun dans son rôle :

- **classes DSFR** (`fr-*`) pour la typographie (`fr-h6`, `fr-text--sm`), les espacements (`fr-mt-4w`, `fr-p-2w`) et la grille (`fr-container`) ;
- **Tailwind** pour la mise en page (`flex`, `gap-4`, `items-center`, `w-full`…), que le DSFR ne couvre pas.

```tsx
<div className="fr-container fr-mt-4w flex justify-between items-center">
```

Les espacements DSFR s'expriment en `v` (0,25 rem) ou en `w` (0,5 rem) : `fr-mt-4w` vaut 2 rem.

Un fichier CSS dédié (`ui/AlertDrawer/custom.css`, par exemple) n'est justifié que pour ce qu'aucun des deux ne sait faire : animations, pseudo-éléments, surcharge d'un composant DSFR.

## Les layouts

Chaque page s'enveloppe dans `Layout` (`ui/layouts/layout.tsx`), qui affiche l'en-tête, la navigation, la recherche globale et le pied de page.

| Prop           | Effet                                                                               |
| -------------- | ----------------------------------------------------------------------------------- |
| `hideFooter`   | Masque le pied de page                                                              |
| `isMapLayout`  | La page occupe exactement la hauteur de l'écran, sans défilement (pages avec carte) |
| `isPublicPage` | Masque la navigation réservée aux utilisateurs connectés                            |

`MapLayout` (`ui/layouts/MapLayout`) organise les pages avec carte : une carte au centre, des barres latérales repliables à gauche et à droite. Il s'utilise à l'intérieur de `Layout`.

## Les graphiques

Les graphiques utilisent [Chart.js](https://www.chartjs.org/) via `react-chartjs-2`. Les types courants sont déjà encapsulés dans `ui/Charts/` : `Doughnut`, `VerticalChartBar`, `HorizontalChartBar`, `EvolutiveChartLine`, `ScatterChart`.

Pour proposer le téléchargement d'un graphique en PNG, passer une ref au composant et utiliser le hook `useExportGraph` (`hooks/use_export_graph.ts`).

## Storybook

[Storybook](https://storybook.js.org/) affiche les composants de `ui/` isolément, avec leurs différentes variantes, sans lancer l'application ni la base de données.

```bash
npm run storybook
```

### Écrire une story

La story se place dans le dossier du composant (`ui/Divider/divider.stories.tsx`) :

```tsx
import Divider, { DividerProps } from './index.js'

const meta = {
  title: 'UI/Divider',
  component: Divider,
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'Le texte à afficher au centre du diviseur (optionnel)',
    },
  },
  args: {
    label: 'Texte du diviseur',
  } as DividerProps,
}

export default meta

export const Défaut = {}

export const SansTexte = {
  args: {
    label: undefined,
  },
}
```

- `tags: ['autodocs']` génère une page de documentation à partir des props.
- Chaque export nommé est une variante du composant.
- Un sélecteur « Thème » permet de vérifier le rendu en mode sombre.
- L'onglet « Accessibility » signale les problèmes d'accessibilité.

### Composants qui utilisent Inertia

Inertia n'existe pas dans Storybook : `@inertiajs/react` y est remplacé par une imitation (`.storybook/inertia-mock.tsx`). `Link` y devient une simple balise `<a>`, et `router` ne fait rien.

Si le composant lit la page courante avec `usePage`, les données renvoyées se définissent dans la story :

```tsx
parameters: {
  inertia: {
    url: '/accueil',
    component: 'MockComponent',
    props: { user: { fullName: 'Jeanne Martin' } },
    version: '1',
  },
},
```

En dehors des layouts, un composant de `ui/` qui a besoin de ce mécanisme est souvent un composant métier qui s'ignore.
