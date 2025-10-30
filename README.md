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

Le reste dépend de la logique métier et sort du cadre de ce README.

## Exécution de Storybook

```shell
npm run storybook
```

Cela lancera Storybook sur `http://localhost:6006`.
