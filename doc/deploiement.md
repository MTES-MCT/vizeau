# Déploiement

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
- `DRIVE_DISK` : Le disque de stockage à utiliser pour les fichiers téléchargés. En production, il doit être défini sur `userUploadsS3`.
- `USER_UPLOADS_S3_ACCESS_KEY` : Le nom de votre clef d'accès à votre bucket S3.
- `USER_UPLOADS_S3_SECRET_KEY` : La valeur de votre clef d'accès à votre bucket S3.
- `USER_UPLOADS_S3_REGION` : La région de votre bucket S3. Pré-configuré pour l'hébergeur Scaleway à Paris.
- `USER_UPLOADS_S3_BUCKET` : Le nom de votre bucket.
- `USER_UPLOADS_S3_ENDPOINT` : L'URL de l’endpoint de l’espace de stockage, sans le nom du bucket. Pré-configuré pour l'hébergeur Scaleway.
- `AAC_FILES_S3_*` : Idem pour le bucket qui contient les fichiers sensibles liés à la qualité de l'eau.
- `DRY_RUN` : Si elle vaut `1` ou `true` (par exemple `DRY_RUN=1`), la commande `db:seed` n'écrit rien en base et affiche pour chaque seeder les changements qu'il appliquerait (lignes à créer, champs modifiés, rattachements ajoutés ou retirés). Elle ne se définit pas dans le `.env`, mais ponctuellement au lancement de la commande : `DRY_RUN=1 node ace db:seed`.

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

Pour prévisualiser les changements d'un seeder avant de l'appliquer, lancez-le d'abord avec la variable `DRY_RUN`. Aucune donnée n'est alors écrite :

```bash
# Tous les seeders
DRY_RUN=1 node ace db:seed
# Un seul seeder (dans le dossier `build`, les seeders sont compilés en `.js` ; en local, utilisez le fichier `.ts`)
DRY_RUN=1 node ace db:seed --files database/seeders/7_territoire_seeder.js
```

Chaque seeder prévisualise ses changements à partir de l'état actuel de la base. Lors d'un aperçu de tous les seeders, un seeder ne voit donc pas les données qu'un seeder précédent aurait créées.

### Migration du bucket S3

Nous stockons divers fichiers en lecture seule dans un bucket S3 sur Scaleway, notamment les tuiles vectorielles utilisées pour les cartes, ou les fichiers parquet recensant les AACs.
Les buckets sont suffixés par le nom de l'environnement. Lorsqu'un fichier doit être mis à jour, nous faisons d'abord nos tests sur les bucket `*-dev`.
Lors de la mise en production, il faut vérifier que le fichier équivalent dans `*-prod` est bien à jour.

Les fichiers parquet sont mis en cache côté applicatif. Ce cache in-memory ne se réinitialise qu'au redémarrage du conteneur. Veillez donc à systématiquement le redémarrer après avoir modifié des fichiers parquet sur le S3.

## Créer des comptes sur Scalingo

Le batch d'utilisateurs (fichier JSON lu par `user:seed --file`, voir [commandes.md](commandes.md)) est envoyé dans un conteneur one-off avec `scalingo run --file`. Le fichier est déposé dans `/tmp/uploads/` et disparaît avec le conteneur.

Remplacer `vizeau-dev` par l'application cible et `users.json` par le nom du batch.

```bash
scalingo -a vizeau-dev --region osc-fr1 run --file users.json \
  "cd build && export NODE_ENV=production \
   && node ace user:seed --file /tmp/uploads/users.json \
   && node ace user:assign-territoires --file /tmp/uploads/users.json"
```

Pour prévisualiser, ajouter `--dry-run` aux deux commandes : rien n'est écrit. Les territoires ne sont prévisualisés que pour les comptes qui existent déjà.

- `user:seed` ne crée que les nouveaux comptes. Un email listé `Skip` existait déjà : son compte n'est pas modifié et les identifiants envoyés ne fonctionneront pas pour lui.
- `user:assign-territoires` affiche `Territoire codes not found` pour les codes absents du référentiel AAC de l'environnement.

Importer le même batch sur dev et sur prod donne les mêmes mots de passe aux deux environnements.
