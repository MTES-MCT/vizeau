# RPG → PMTiles

Pipeline [Tylt](https://github.com/vlnk/tylt) pour télécharger le **Registre Parcellaire Graphique (RPG)** publié par IGN/Géoportail, le convertir en FlatGeobuf, et assembler un fichier **PMTiles** multi-couches prêt à être servi.

## Prérequis

- [Tylt](https://github.com/vlnk/tylt) installé et accessible dans le PATH
- Docker (utilisé par Tylt pour les étapes conteneurisées)
- Accès S3 compatible (Scaleway, AWS…) pour l'upload _(optionnel)_

## Configuration

Copier `.env.example` en `.env` et renseigner les credentials S3 :

```bash
cp .env.example .env
```

| Variable               | Description                                            |
| ---------------------- | ------------------------------------------------------ |
| `S3_ENDPOINT`          | URL du endpoint S3 (ex. `https://s3.fr-par.scw.cloud`) |
| `S3_REGION`            | Région S3 (ex. `fr-par`)                               |
| `S3_BUCKET`            | Nom du bucket S3                                       |
| `S3_ACCESS_KEY_ID`     | Clé d'accès S3                                         |
| `S3_SECRET_ACCESS_KEY` | Secret S3                                              |

Les millésimes disponibles et leurs URLs sources sont définis dans `config.yaml`.

## Utilisation

### Pipeline complet (téléchargement + conversion + upload S3 + nettoyage)

```bash
./run.sh 2024
```

Le workspace est automatiquement supprimé après un upload réussi.
En cas d'échec, il est conservé pour permettre le debug (`tylt show rpg-2024`, `tylt logs rpg-2024 <étape>`).

### Sans upload S3 (arrêt après build)

```bash
./run.sh 2024 --target build-pmtiles
```

### Forcer le re-téléchargement

```bash
./run.sh 2024 --force download
```

### Exporter le PMTiles en local (sans upload)

```bash
./run.sh 2024 --target build-pmtiles
tylt export rpg-2024 build-pmtiles ./output/
```

## Étapes du pipeline

| #   | ID              | Description                                                          |
| --- | --------------- | -------------------------------------------------------------------- |
| 1   | `setup`         | Lit `config.yaml`, résout l'URL source pour le millésime demandé     |
| 2   | `discover`      | Sonde les URLs pour détecter archive unique (`.7z`) ou multi-parties |
| 3   | `download`      | Télécharge toutes les parties en parallèle                           |
| 4   | `extract`       | Extrait l'archive 7z (`.7z` ou `.7z.001`)                            |
| 5   | `convert`       | Convertit chaque couche GeoPackage LAMB93 → FlatGeobuf WGS84         |
| 6   | `build-pmtiles` | Assemble les FlatGeobuf en un PMTiles multi-couches via tippecanoe   |
| 7   | `upload`        | Envoie le PMTiles vers le bucket S3                                  |

## Couches PMTiles produites

| Source-layer   | Contenu                 |
| -------------- | ----------------------- |
| `parcelles`    | Parcelles agricoles PAC |
| `parcellesbio` | Parcelles bio (RPG BIO) |

Zoom min/max configurables dans `config.yaml` (défaut : zoom 5–14).

## Structure du projet

```
.
├── config.yaml        # Millésimes, URLs sources, options tippecanoe
├── pipeline.yaml      # Définition du pipeline Tylt
├── .env.example       # Variables d'environnement (modèle)
└── scripts/
    ├── setup.py       # Résolution de la config millésime
    ├── discover.sh    # Détection des parties d'archive
    ├── download.sh    # Téléchargement parallèle
    ├── fetch-bio.sh   # Récupération RPG BIO (IGN ou data.gouv.fr)
    ├── convert.sh     # Conversion GeoPackage → FlatGeobuf
    ├── build.sh       # Assemblage PMTiles (tippecanoe)
    └── upload.sh      # Upload S3
```
