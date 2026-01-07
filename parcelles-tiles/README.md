# Script de génération de tuiles RPG

## Remplir les variables d'environnement :

`WORKDIR=/tmp/rpg` -> Dossier dans lequel les fichiers seront convertis avant d'être envoyés sur le S3
`DATA_URL` -> URL vers l'archive à utiliser pour la création des tuiles

`S3_KEY=2024/parcelles_france.pmtiles` -> Nom du fichier de sortie sur S3 _(Attention avec le dossier / année)_
`S3_ENDPOINT` -> Lien vers le bucket S3
`S3_REGION `-> Région du S3
`S3_BUCKET` -> Nom du bucket S3
`S3_ACCESS_KEY_ID` -> Identifiant S3
`S3_SECRET_ACCESS_KEY` -> Clé de connexion S3

## Lancer le script :

Avec Docker :

Construction de l'image :

```bash
docker build -t parcelles-tiles .
```

Lancement du script en mode interactif _(Pour avoir un retour visuel en cas d'erreur)_ :

```bash
docker run --rm parcelles-tiles
```

Si tout s'est bien passé, le fichier généré se trouvera dans le S3 configuré

> [!warning]
> Si le bucket contient déjà un fichier `.pmtiles`, il sera écrasé.

> [!warning]
> Il faut penser à mettre le fichier en visibilité "publique" sur Scaleway.

---
