# Viz'eau

Monorepo AdonisJS 7 (TypeScript, Lucid, PostgreSQL) avec un frontend React servi par InertiaJS.
AdonisJS 7 est récent : ses API (transformers, `urlFor`, `#generated/*`) diffèrent des v5/v6, vérifier la doc v7 en cas de doute.

Viz'eau est un projet de l'État français : privilégier au maximum les outils open source et/ou souverains, notamment pour toute nouvelle dépendance ou tout nouveau service.

Le français est utilisé partout où c'est possible : code (modèles, variables, fonctions), commentaires, documentation, interface, messages de commit et PR.
L'anglais n'est admis que pour les termes trop techniques pour être traduits naturellement (controller, middleware, transformer, seeder…) et pour ce qu'imposent les frameworks et outils.

# Règles métier transverses

**Cloisonnement par territoire.** Un utilisateur n'accède qu'aux données (exploitations, projets, AAC…) des territoires qui lui sont assignés.
Le filtrage se fait dans les services (`whereHas('territoires', …)` jusqu'aux `users`) et l'autorisation sur une ressource via les policies Bouncer de `app/policies`.
Toute nouvelle requête ou route doit respecter ce cloisonnement, et les tests doivent couvrir le cas d'un utilisateur d'un autre territoire.

**Données AAC.** Les données des aires d'alimentation de captage ne sont pas dans PostgreSQL : elles sont lues dans des fichiers Parquet sur S3 via DuckDB (`app/services/duckdb_service.ts`, disque `aacFilesS3`).
Pour optimiser ces requêtes, agir sur la requête ou l'application, pas sur la génération des fichiers Parquet qui sont la responsabilité d'un autre projet.

# Backend

- Utiliser les alias `#…` définis dans `package.json` (`imports`) plutôt que des chemins relatifs.
- `.adonisjs/` (d'où vient `#generated/*`) est généré automatiquement : ne pas le modifier.
- La logique métier va dans un service de `app/services`, injecté dans le controller via `@inject()`. Les controllers restent fins.
- Les entrées sont validées avec VineJS (`app/validators`) via `request.validateUsing`. Attention : les query strings absentes arrivent en chaînes vides, pas en `undefined`.
- Les données envoyées aux pages Inertia sont sérialisées avec des transformers (`app/transformers`, `BaseTransformer`). `app/dto` est legacy et en cours de suppression : ne pas y ajouter de code.
- Les routes référencent les controllers via `controllers.X` de `#generated/controllers` ; construire les URL avec `urlFor()` plutôt qu'en dur.
- Ne pas charger une table entière (`Model.all()`, requête sans filtre) pour filtrer en JavaScript : exprimer le filtre dans la requête Lucid, et préférer `query().where(...).update(...)` aux sauvegardes une par une.
- Ne jamais accéder directement à un membre d'une expression `await` (`(await query).length`) : passer par une variable intermédiaire (règle ESLint `@unicorn/no-await-expression-member`).
- Les commandes `ace` du projet sont documentées dans `doc/commandes.md`.

## Modifier une entité

- Modifier le modèle.
- Créer une nouvelle migration avec `node ace make:migration nom_en_snake_case` (nom décrivant l'action), puis la compléter. Ne jamais modifier une migration existante.
- `tableName` doit pointer sur `Model.table`, sauf pour une table de liaison many-to-many.
- Mettre à jour la factory si besoin.

## Seeders

Les seeders (`database/seeders`) sont autonomes et découplés de l'application : toute leur logique (y compris le mode dry run) reste dans le fichier du seeder, quitte à dupliquer du code.
Ils peuvent utiliser les modèles Lucid et `DuckdbService`, mais aucun autre service.

# Frontend

- La racine est le dossier `inertia`, importé via l'alias `~`.
- React 19, DSFR (`@codegouvfr/react-dsfr`) et Tailwind 4. Ne pas introduire d'autre librairie UI.
- `inertia/pages` : pages Inertia. `inertia/components` : composants métier. `inertia/ui` : composants génériques réutilisables, avec leurs stories Storybook.

# Tests

Lancer les tests : `node ace test` (ou `node ace test unit` / `node ace test functional`).
Pour un seul fichier : `node ace test --files=tests/functional/xxx.spec.ts`.
Pour vérifier le typage sans lancer les tests : `npm run typecheck`.

Prérequis : un PostgreSQL accessible selon `.env.test` (port 5433, base `vizeau_test`).
Pour le démarrer, lancer `./start_test_db.sh`, qui crée le conteneur Docker `vizeau-test-db`.
Si le conteneur existe déjà mais est arrêté, utiliser `docker start vizeau-test-db`.
Les migrations sont exécutées puis annulées automatiquement par `tests/bootstrap.ts`, il ne faut pas les lancer manuellement.

Les tests utilisent Japa (https://docs.adonisjs.com/guides/testing/introduction). Créer les modèles avec les factories de `database/factories`.

# Git

- Messages de commit en français. Branches préfixées `feat/`, `fix/` ou `chore/`, PR vers `main`.
- Le hook pre-commit lance `format`, `lint` et `build` : ne jamais lancer le lint manuellement, ni le build avant un commit.
