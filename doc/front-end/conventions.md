# Conventions

Le code existant respecte ces conventions, à une exception près : de nombreux composants et pages sont encore typés avec `any` (voir [Typage](#typage)). Les corriger au passage quand on modifie un fichier.

## Langue

- **Code** (variables, fonctions, composants, props) : en anglais.
- **Termes métier** : restent en français, y compris dans le code (`aacCode`, `territoires`, `millesime`, `showParcelles`).
- **Textes affichés, commentaires, noms des stories** : en français.

## Nommage des fichiers

| Emplacement          | Convention                                                            | Exemple                                                      |
| -------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `pages/`             | snake_case, correspond au nom passé à `inertia.render`                | `pages/errors/not_found.tsx`                                 |
| `components/`        | kebab-case                                                            | `components/exploitations/exploitations-list.tsx`            |
| `ui/`                | Un dossier en PascalCase, avec `index.tsx` et une story en kebab-case | `ui/TagsList/index.tsx`, `ui/TagsList/tags-list.stories.tsx` |
| `hooks/`             | snake_case, préfixé par `use_`                                        | `hooks/use_map.ts`                                           |
| `functions/`, `lib/` | snake_case                                                            | `functions/flash_messages.tsx`                               |

Les composants eux-mêmes sont nommés en PascalCase et exportés par défaut (`export default function ExploitationsList`), quel que soit le nom du fichier.

Deux exceptions :

- un fichier qui regroupe plusieurs petits composants liés les exporte par leur nom (`components/flash-message.tsx` exporte `FlashMessage` et `FlashMessages`) ;
- un fichier de `components/` qui ne contient pas de composant (configuration, constantes) suit la convention de `functions/` : snake_case (`components/projets/form/steps_config.ts`).

## Où ranger le code

| Dossier      | Quoi                                                                              | Exemple                                        |
| ------------ | --------------------------------------------------------------------------------- | ---------------------------------------------- |
| `functions/` | Fonctions et constantes sans appel réseau : formatage, calculs, configuration     | `formatDateFr`, `GROUPES_CULTURAUX`            |
| `lib/`       | Fonctions qui appellent un service externe ou produisent un fichier à télécharger | API Adresse, vérification de SIRET, export CSV |
| `hooks/`     | Hooks React réutilisés par plusieurs composants                                   | `useMap`, `useFetch`                           |
| `data/`      | Référentiels statiques en JSON                                                    | `cultures.json`                                |

Une fonction utilisée par un seul composant reste dans le fichier du composant. Elle ne rejoint `functions/` que lorsqu'un second composant en a besoin.

## Typage

- Typer les props des pages et des composants métier avec les types `Data.*` (`@generated/data`), générés à partir des transformers, plutôt qu'avec `any`.
- Exporter le type des props d'un composant de `ui/` (`export type TagsListProps`), pour qu'il soit réutilisable dans les stories et par les composants qui l'utilisent.

## Recette : ajouter une page

Exemple : une page qui liste les captages d'un territoire.

### 1. La route

Dans `start/routes.ts`, dans le groupe protégé adapté, avec un nom :

```ts
router.get('territoires/:id/captages', [controllers.Captages, 'index']).as('territoires.captages')
```

### 2. Le controller

Le controller reste fin : il récupère l'utilisateur, appelle un service, transforme le résultat et rend la page.

```ts
@inject()
export default class CaptagesController {
  constructor(public captageService: CaptageService) {}

  async index({ auth, params, inertia }: HttpContext) {
    const user = auth.getUserOrFail()
    const captages = await this.captageService.getForTerritoire(params.id, user.id)

    return inertia.render('territoires/captages', {
      captages: CaptageTransformer.transform(captages),
    })
  }
}
```

Le service ne doit renvoyer que les données des territoires de l'utilisateur (voir la règle de cloisonnement dans `AGENTS.md`).

### 3. La page

Dans `inertia/pages/territoires/captages.tsx` :

```tsx
import { Head } from '@inertiajs/react'
import type { Data } from '@generated/data'
import Layout from '~/ui/layouts/Layout'

export default function TerritoireCaptages({ captages }: { captages: Data.Captage[] }) {
  return (
    <Layout>
      <Head title="Captages du territoire" />
      <div className="fr-container fr-my-4w">{/* … */}</div>
    </Layout>
  )
}
```

### 4. Les liens vers la page

```tsx
<Button linkProps={{ href: urlFor('territoires.captages', { id: territoire.id }) }}>
  Voir les captages
</Button>
```

### 5. Les tests

Ajouter un test fonctionnel dans `tests/functional/`, qui vérifie au minimum :

- que la page s'affiche pour un utilisateur du territoire ;
- qu'un utilisateur d'un autre territoire n'accède pas aux données.

Voir [Pages et données](pages-et-donnees.md) pour les props différées, les formulaires et les messages flash.
