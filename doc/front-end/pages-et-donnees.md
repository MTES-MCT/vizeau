# Pages et données

Avec Inertia, il n'y a pas d'API entre le serveur et le front. Le controller choisit une page React et lui passe directement ses données sous forme de props.
Au premier chargement, la page est rendue côté serveur (SSR). Ensuite, les navigations se font en JavaScript : Inertia demande au serveur la page suivante et ses props en JSON, puis remplace le composant sans recharger le navigateur.

## Le parcours d'une page

Exemple avec la liste des exploitations :

```
GET /exploitations
  → start/routes.ts                  route nommée 'exploitations.index'
  → ExploitationsController.index    récupère les données via un service
  → ExploitationTransformer          sérialise les modèles Lucid
  → inertia.render('exploitations/index', props)
  → inertia/pages/exploitations/index.tsx
```

### Côté serveur

Le controller appelle un service, puis passe le résultat dans un transformer avant de le donner à `inertia.render`.
Le premier argument de `inertia.render` est le chemin de la page dans `inertia/pages`, sans l'extension.

```ts
// app/controllers/exploitations_controller.ts
return inertia.render('exploitations/creation', {
  exploitationTags: ExploitationTagTransformer.transform(
    await this.exploitationTagService.getExploitationTags()
  ),
  territoires: TerritoireTransformer.paginate(
    paginatedTerritoires.all(),
    paginatedTerritoires.getMeta()
  ),
})
```

Les transformers (`app/transformers`) choisissent les champs exposés au front. Ne jamais passer un modèle Lucid brut à une page : tout ce qui est envoyé est lisible dans le navigateur.
Les relations ne sont incluses que si elles ont été préchargées (`this.whenLoaded(...)`).

### Côté page

Une page est un composant React exporté par défaut, qui reçoit les props du controller.
Elle s'enveloppe dans le `Layout` commun et définit son titre avec `Head` (le suffixe « - Viz'Eau » est ajouté automatiquement).

```tsx
// inertia/pages/journal/creation.tsx
import { Head } from '@inertiajs/react'
import type { Data } from '@generated/data'
import Layout from '~/ui/layouts/Layout'

export default function TaskCreationPage({ exploitation }: { exploitation: Data.Exploitation }) {
  return (
    <Layout>
      <Head title="Créer une tâche" />
      {/* … */}
    </Layout>
  )
}
```

### Typer les props

Les types `Data.*` (`@generated/data`) sont générés automatiquement à partir des transformers : `Data.Exploitation` correspond exactement à ce que renvoie `ExploitationTransformer`.
Ils sont à privilégier plutôt que `any`, encore présent dans plusieurs pages.

Le dossier `.adonisjs/` qui contient ces types est régénéré par `npm run dev` : s'ils ne correspondent plus au transformer, relancer le serveur.

## Props partagées

Certaines props sont envoyées à toutes les pages, sans que le controller ait à les passer. Elles sont définies dans `app/middleware/inertia_middleware.ts` :

- `user` : l'utilisateur connecté, ou `undefined` ;
- `errors` : les erreurs de validation du dernier formulaire envoyé.

Elles sont accessibles depuis n'importe quel composant avec `usePage` :

```tsx
const { props } = usePage()
const isAuthenticated = Boolean(props.user)
```

## Charger les données plus tard

Par défaut, toutes les props sont calculées avant d'afficher la page. Pour les requêtes lentes (données AAC lues dans DuckDB notamment), on peut les différer.

| Côté serveur                                  | Comportement                                                                                      |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `inertia.defer(async () => …)`                | La page s'affiche tout de suite, la prop est chargée juste après par une seconde requête          |
| `inertia.optional(async () => …)`             | La prop n'est jamais envoyée, sauf si la page la demande explicitement                            |
| Prop sous forme de fonction (`async () => …`) | Calculée au premier chargement, mais ignorée lors d'un rechargement partiel qui ne la demande pas |

Côté page, une prop différée s'affiche dans un composant `Deferred`, avec un contenu d'attente :

```tsx
// inertia/pages/territoires/index.tsx
<Deferred data={['territoires', 'meta']} fallback={<Loader />}>
  {/* territoires et meta sont disponibles ici */}
</Deferred>
```

### Rechargements partiels

Pour mettre à jour une partie de la page (recherche, pagination, filtre) sans tout recharger, on redemande au serveur uniquement les props concernées avec `only` :

```tsx
// inertia/pages/exploitations/index.tsx
router.reload({
  only: ['exploitationsWithPagination', 'queryString'],
  data: { recherche: e.target.value, page: 1 },
  replace: true,
})
```

C'est aussi ainsi qu'on charge une prop `optional`.

## Naviguer et construire une URL

Les URL se construisent à partir du nom de la route avec `urlFor`, plutôt qu'en dur :

```tsx
import { urlFor } from '~/client'

router.post(urlFor('projets.steps.complete', { projectId }), { id: step.id })
```

Pour naviguer :

- les composants DSFR qui acceptent `linkProps` (`Button`, `Breadcrumb`, `Card`…) utilisent automatiquement la navigation Inertia, configurée dans `app.tsx` ;
- en dehors d'un composant DSFR, utiliser `Link` (lien) ou `router.visit`, `router.post`, `router.delete`… (action).

Une balise `<a>` classique fonctionne, mais recharge toute la page.

## Formulaires

Les formulaires utilisent `useForm` d'Inertia, qui gère les valeurs, l'envoi et les erreurs :

```tsx
const { data, setData, errors, post, processing } = useForm<ExploitationFormValues>({
  name: '',
  siret: '',
})

const handleSubmit = (e: FormEvent) => {
  e.preventDefault()
  post(urlFor('exploitations.store'))
}
```

Côté serveur, le controller valide avec VineJS (`request.validateUsing(...)`).
Si la validation échoue, l'utilisateur est renvoyé sur le formulaire et les erreurs arrivent dans `errors`, indexées par nom de champ : `errors.siret` contient le message à afficher sous le champ SIRET.

Si la validation réussit, le controller termine par une redirection (`response.redirect().toRoute(...)` ou `.back()`), jamais par un `inertia.render`.

## Messages flash

Un message flash est un message ponctuel, envoyé par le controller et affiché après la redirection (« Exploitation créée », « Accès refusé »…).

Côté serveur, utiliser les helpers de `app/helpers/flash_message.ts` :

```ts
createSuccessFlashMessage(session, 'Exploitation créée avec succès')
createErrorFlashMessage(session, 'Titre', 'Description facultative', 'contexte')
```

Côté front, il y a deux affichages possibles :

- **sans contexte** (cas général) : le message s'affiche automatiquement en toast, en haut de l'écran. Rien à faire dans la page, c'est géré dans `app.tsx` par `showFlashToasts`.
- **avec contexte** : le message n'est pas affiché en toast. La page doit l'afficher elle-même à l'endroit voulu avec le composant `FlashMessages` de `~/components/flash-message` (`<FlashMessages context="territoire" />`).

## Rendu côté serveur (SSR)

Au premier chargement, chaque page est d'abord rendue en HTML sur le serveur (`inertia/ssr.tsx`), puis reprise par React dans le navigateur (`inertia/app.tsx`).

Conséquences :

- **pas d'accès à `window`, `document` ou `localStorage` pendant le rendu** : ces objets n'existent pas sur le serveur. Les utiliser uniquement dans un `useEffect` ou un gestionnaire d'événement. C'est pour cette raison que la carte MapLibre est créée dans un `useEffect` (`hooks/use_map.ts`) ;
- **le rendu doit être identique sur le serveur et dans le navigateur** : une valeur qui change entre les deux (date courante, nombre aléatoire) provoque une erreur d'hydratation dans la console ;
- **`app.tsx` et `ssr.tsx` doivent rester alignés** : un provider ajouté dans l'un doit l'être dans l'autre.
