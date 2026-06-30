# Génération des fiches AAC

Pipeline Node.js qui génère des fiches descriptives pour chaque **Aire d'Alimentation de Captage (AAC)** à partir de données géospatiales stockées sur S3, et publie le résultat en Parquet sur S3.

## Fonctionnement

Le pipeline s'exécute en 3 étapes :

1. **Téléchargement** — récupère les fichiers source Parquet depuis S3 vers `data/`
2. **Génération des fiches** — 5 phases de traitement via DuckDB :
   - Phase 1 : données légères (AAC, zones PP, communes, captages)
   - Phase 2 : parcelles bio RPG annuelles (scan spatial)
   - Phase 3 : parcelles RPG toutes cultures (scan spatial, plusieurs minutes)
   - Phase 4 : évolution annuelle des cultures (`RPG_YYYY.parquet` depuis S3)
   - Phase 5 : assemblage des fiches JSON
3. **Push S3** — sérialise les fiches en Parquet et pousse vers S3

Chaque fiche AAC contient : nom, code, surface, emprise (bbox), communes recouvertes, installations de captage, répartition des cultures (SAU globale, PPE, PPR), part de l'agriculture biologique et évolution annuelle des cultures.

## Prérequis

- Node.js ≥ 22
- Accès S3 (Scaleway par défaut, configurable)

## Installation

```bash
npm install
```

## Configuration

Créer un fichier `.env` à la racine :

```env
S3_BUCKET=mon-bucket          # Bucket source (requis)
S3_ACCESS_KEY=AKIAXXXXXXXX    # Clé d'accès S3 (requis)
S3_SECRET_KEY=xxxxxxxx        # Clé secrète S3 (requis)
S3_REGION=fr-par              # Région (défaut : fr-par)
S3_ENDPOINT=s3.fr-par.scw.cloud  # Endpoint (défaut : s3.fr-par.scw.cloud)
S3_PREFIX=                    # Préfixe des fichiers source (optionnel)
S3_BIO_DIR=bio                # Répertoire S3 des fichiers rpg_bio_YYYY.parquet
S3_RPG_DIR=RPG                # Répertoire S3 des RPG annuels RPG_YYYY.parquet
S3_OUTPUT_BUCKET=             # Bucket de destination (défaut : S3_BUCKET)
S3_OUTPUT_KEY=aac.parquet     # Clé du fichier de sortie (défaut : aac.parquet)
```

## Utilisation

```bash
npm start
# ou directement :
node --env-file=.env generate_aac_infos.js
```

## Fichiers source attendus sur S3

| Fichier                          | Description                                                      |
| -------------------------------- | ---------------------------------------------------------------- |
| `aac_hilbert.parquet`            | Géométries des AAC (WGS84)                                       |
| `aac_pp_zones.parquet`           | Zones de protection (PPE, PPR, PPI)                              |
| `communes_hilbert.parquet`       | Géométries des communes                                          |
| `captages.parquet`               | Installations de captage                                         |
| `captages_prioritaires_2026.csv` | Référentiel des captages prioritaires (BSS)                      |
| `rpg_bio_YYYY.parquet`           | Parcelles RPG bio annuelles (dans `S3_BIO_DIR`)                  |
| `rpg_parcelles.parquet`          | Parcelles RPG toutes cultures                                    |
| `RPG_YYYY.parquet`               | RPG annuel utilisé pour `cultures_evolution` (dans `S3_RPG_DIR`) |

## Sortie

Fichier `aac.parquet` (configurable via `S3_OUTPUT_KEY`) poussé sur S3, contenant une ligne par AAC avec les champs suivants :

- `nom`, `code`, `prioritaire`, `date_creation`, `date_maj`, `bbox`, `surface`
- `nb_captages_actifs`, `nb_installations`
- `surface_agricole`, `nb_parcelles`
- `communes` — liste des communes avec surface et répartition
- `surface_agricole_utile` — SAU par groupe de culture (nb parcelles, surface, % SAU)
- `surface_agricole_ppe` / `surface_agricole_ppr` — idem dans les zones de protection
- `surface_agricole_bio` — nb parcelles, surface et part bio
- `installations` — captage de référence, captages rattachés, statut prioritaire
- `cultures_evolution` — objet `{ aac, nom, repartition }` strictement aligné avec l'ancien script, où `repartition` contient les années `2020..2024` et, pour chaque groupe, `{ surface_ha, nb_parcelles }`
