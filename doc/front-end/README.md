# Front-end

Le front-end de Viz'eau est une application React servie par AdonisJS via [InertiaJS](https://inertiajs.com/).
Il n'y a pas d'API REST entre les deux : un controller AdonisJS choisit une page React et lui passe ses données sous forme de props.

## Stack

| Outil                                                                                 | Rôle                                                                                  |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| [React 19](https://react.dev/)                                                        | Bibliothèque d'interface                                                              |
| [InertiaJS](https://inertiajs.com/) (`@adonisjs/inertia`)                             | Lien entre les controllers AdonisJS et les pages React, avec rendu côté serveur (SSR) |
| [DSFR](https://www.systeme-de-design.gouv.fr/) (`@codegouvfr/react-dsfr`)             | Système de design de l'État : composants, couleurs, icônes, pictogrammes              |
| [Tailwind 4](https://tailwindcss.com/)                                                | Classes utilitaires de mise en page, en complément du DSFR                            |
| [MapLibre GL](https://maplibre.org/) + [PMTiles](https://docs.protomaps.com/pmtiles/) | Cartographie                                                                          |
| [Chart.js](https://www.chartjs.org/)                                                  | Graphiques                                                                            |
| [Storybook](https://storybook.js.org/)                                                | Catalogue et développement isolé des composants de `inertia/ui`                       |
| [Tuyau](https://tuyau.julr.dev/)                                                      | Construction typée des URL des routes (`urlFor`)                                      |

Aucune autre librairie UI ne doit être introduite : on compose avec le DSFR et Tailwind.

## Arborescence

Tout le code front se trouve dans `inertia/`, importé via l'alias `~` (`~/ui/Loader`, `~/hooks/use_map`…).

| Dossier / fichier | Contenu                                                                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `app.tsx`         | Point d'entrée côté navigateur : styles globaux, initialisation du DSFR, résolution des pages, messages flash                         |
| `ssr.tsx`         | Point d'entrée du rendu côté serveur. Doit rester aligné avec `app.tsx`                                                               |
| `client.ts`       | Client Tuyau et fonction `urlFor` pour construire les URL des routes                                                                  |
| `types.ts`        | Typage des props partagées (`InertiaProps`) et des messages flash                                                                     |
| `pages/`          | Une page Inertia par fichier, rendue par un controller (`inertia.render('exploitations/index', …)` → `pages/exploitations/index.tsx`) |
| `components/`     | Composants **métier**, rangés par domaine (`exploitations/`, `projets/`, `map/`…)                                                     |
| `ui/`             | Composants **génériques** et réutilisables, un dossier par composant avec son `index.tsx` et sa story Storybook                       |
| `ui/layouts/`     | Mise en page commune (en-tête, pied de page, recherche globale) utilisée par toutes les pages                                         |
| `hooks/`          | Hooks React (`use_map`, `use_fetch`, `use_global_search`…)                                                                            |
| `functions/`      | Fonctions utilitaires sans appel réseau : formatage, couleurs, calculs liés à la carte                                                |
| `lib/`            | Fonctions qui appellent un service externe ou produisent un fichier (API Adresse, vérification de SIRET, export CSV)                  |
| `utils/`          | Ancien dossier de constantes, amené à disparaître : ne rien y ajouter                                                                 |
| `data/`           | Référentiels statiques en JSON (codes NAF, cultures)                                                                                  |
| `css/app.css`     | Import de Tailwind et quelques styles globaux                                                                                         |

### Composant métier ou générique ?

- Le composant connaît une notion du métier (exploitation, AAC, parcelle, projet…) ou appelle le serveur : `components/`.
- Le composant pourrait servir tel quel dans une autre application : `ui/`, avec une story.

## Lancer le front

Le front est servi par le serveur AdonisJS, avec rechargement à chaud :

```bash
npm run dev
```

Pour travailler sur un composant de `inertia/ui` sans lancer l'application :

```bash
npm run storybook
```

Storybook est alors accessible sur [http://localhost:6006](http://localhost:6006).

## Pour aller plus loin

- [Pages et données](pages-et-donnees.md) : du controller à la page, formulaires, messages flash, SSR
- [Composants](composants.md) : DSFR, Tailwind, `ui` face à `components`, Storybook
- [Carte](carte.md) : MapLibre, PMTiles, couches et réconciliation
- [Conventions](conventions.md) : nommage, typage, recette pour ajouter une page
