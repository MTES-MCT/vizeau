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

   En plus de l'admin (`ADMIN_EMAIL`), qui a accès à tous les territoires, un utilisateur de test `test@vizeau.beta.gouv.fr` (mot de passe `password`) est créé avec les territoires 1, 2 et 3, pour tester le cloisonnement par territoire. Il n'est jamais créé en production. Les autres comptes se créent avec `node ace user:seed --file` (voir [doc/commandes.md](doc/commandes.md)).

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

Cf. [doc/deploiement.md](doc/deploiement.md)

## Exécution de Storybook

```shell
npm run storybook
```

Cela lancera Storybook sur `http://localhost:6006`.

# Documentation

La documentation de l'application se trouve dans le dossier `doc` et est écrite en Markdown.
