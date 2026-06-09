# Viz'eau

## Prérequis

- Node.js 22 LTS ou supérieur
- PostgreSQL 16.9 ou supérieur

## Exécution en mode développement

1. Assurez-vous que votre serveur PostgreSQL est en cours d’exécution.
   Si vous n’en avez pas encore configuré un, vous pouvez exécuter le script `./start_db.sh` pour lancer rapidement une instance PostgreSQL via Docker.

2. Créez un fichier `.env` à la racine du projet à partir du modèle `.env.example` (`cp .env.example .env`), puis définissez la variable `APP_KEY`.
   Il s’agit d’une chaîne aléatoire utilisée pour le chiffrement — sa valeur peut être quelconque en environnement de développement.

3. Installez les dépendances en exécutant :

   ```bash
   npm install
   ```

4. Exécutez les migrations de base de données pour configurer le schéma :

   ```bash
   node ace migration:run
   ```

5. Alimentez la base de données avec ses données initiales :

   ```bash
   node ace db:seed
   ```

6. Démarrez l’application :

   ```bash
   npm run dev
   ```

7. Ouvrez votre navigateur et accédez à `http://localhost:3333` pour utiliser l’application.

## Lancer l'application localement en mode production

Ces instructions vous guideront pour exécuter l’application en mode production sur votre machine locale.
Elles ne sont pas destinées à un déploiement en production réel pour des raisons de sécurité, passez à la section suivante pour cela.

1. Assurez-vous que votre serveur PostgreSQL est en cours d’exécution.
   Si vous n’en avez pas encore configuré un, vous pouvez exécuter le script `./start_db.sh` pour lancer rapidement une instance PostgreSQL via Docker.
2. Comme pour le mode développement, définissez vos variables d'environnement dans un fichier `.env.prod` à la racine du projet. `NODE_ENV` doit être défini sur `production`.
3. Compilez le projet en mode production :

   ```bash
   node ace build
   ```

4. Exécutez les migrations de base de données pour configurer le schéma (si ce n'est pas déjà fait) :

   ```bash
   node ace migration:run
   ```

5. Pour alimenter la base de données avec ses données initiales de production uniquement, exécutez la commande suivante :

   ```bash
   NODE_ENV=production node ace db:seed
   ```

6. Assurez-vous d'être dans le même dossier que ce README et utilisez le script suivant pour démarrer l'application en mode production :

   ```bash
   ./start_local_prod.sh
   ```

   Ce script installera les dépendances de production au premier lancement uniquement puis démarrera l'application en utilisant soit le fichier `.env.prod`, soit le fichier `.env` si le premier n'existe pas.

7. Ouvrez votre navigateur et accédez à `http://localhost:3333` pour utiliser l’application.

## Exécution en production

Lisez d’abord ce guide pour apprendre à construire le bundle de production, à gérer les migrations de base de données et les journaux de l’application :
[https://docs.adonisjs.com/guides/getting-started/deployment](https://docs.adonisjs.com/guides/getting-started/deployment)

Les déploiements doivent être effectués automatiquement à l’aide de pipelines CI/CD.

Quelques notes sur les variables d’environnement :

- `APP_KEY` : Chaîne aléatoire utilisée pour le chiffrement.
  En production, elle doit contenir **au moins 32 caractères**.
- `DB_*` : Paramètres de connexion à la base de données (hôte, port, utilisateur, mot de passe, nom de la base).
  Les valeurs par défaut correspondent à la configuration Docker, **changez leurs valeurs en production**.
- `ADMIN_*` : Identifiants de l’administrateur initial. **Changez ces valeurs en production**.
- `NODE_ENV` : Doit être défini à `'production'` dans un environnement de production ou de préproduction.
- `PMTILES_URL` : URL de base de la source des tuiles vectorielles. Probablement un bucket S3.
- `DRIVE_DISK` : Le disque de stockage à utiliser pour les fichiers téléchargés. En production, il doit être défini sur `spaces`.
- `SPACES_KEY` : Le nom de votre clef d'accès à votre bucket S3.
- `SPACES_SECRET` : La valeur de votre clef d'accès à votre bucket S3.
- `SPACES_REGION` : La région de votre bucket S3. Pré-configuré pour l'hébergeur Scaleway à Paris.
- `SPACES_BUCKET` : Le nom de votre bucket.
- `SPACES_ENDPOINT` : L'URL de l’endpoint de l’espace de stockage, sans le nom du bucket. Pré-configuré pour l'hébergeur Scaleway.
- `USERS_TO_SEED` : Une chaine de caractères au format JSON représentant une liste d'utilisateurs à ajouter à la base de données lors de l'exécution de la commande `db:seed`. Utilisée pour ajouter des utilisateurs en production.

Le reste dépend de la logique métier et sort du cadre de ce README.

## Migration en production

La pipeline CI/CD est configurée pour construire le bundle de production et le déployer sur l'environnement distant de développement à chaque mise à jour de la branche `main`.
Même chose pour la production, mais à partir de la branche `stable`.

Les migrations de schéma de la base de données se font automatiquement. Si pour une raison ou une autre, vous avez besoin d'accéder à un shell sur un des environnements, voici comment faire :

```bash
# Remplacez vizeau-dev par le nom de votre application Scalingo, et la région si nécessaire
scalingo -a vizeau-dev --region osc-fr1 run "NODE_ENV=production bash"
# Une fois connecté, naviguez jusqu'au répertoire de l'application
cd build

# Vous pouvez maintenant exécuter n'importe quelle commande de l'application via `ace`, par exemple pour seeder la base de données :
node ace db:seed
```

### Migration du bucket S3

Nous stockons divers fichiers en lecture seule dans un bucket S3 sur Scaleway, notamment les tuiles vectorielles utilisées pour les cartes, ou les fichiers parquet recensant les AACs.
Les buckets sont suffixés par le nom de l'environnement. Lorsqu'un fichier doit être mis à jour, nous faisons d'abord nos tests sur les bucket `*-dev`.
Lors de la mise en production, il faut vérifier que le fichier équivalent dans `*-prod` est bien à jour.

## Exécution de Storybook

```shell
npm run storybook
```

Cela lancera Storybook sur `http://localhost:6006`.

# Documentation

La documentation de l'application se trouve dans le dossier `doc` et est écrite en Markdown.
