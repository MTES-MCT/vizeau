# AGENTS.md

Instructions for AI coding agents working in this repository.

## Project Overview

Tylt pipeline that downloads RPG (Registre Parcellaire Graphique) open data from the French
IGN/Géoportail, converts GeoPackage layers to FlatGeobuf, and produces a multi-layer PMTiles
file using tippecanoe.

## Key Commands

```bash
# Run full pipeline (includes cleanup after successful upload)
./run.sh 2024

# Run without S3 upload
./run.sh 2024 --target build-pmtiles

# Force re-download (bypass cache)
./run.sh 2024 --force download

# Export produced PMTiles locally (after --target build-pmtiles)
tylt export rpg-2024 build-pmtiles ./output/

# Inspect step logs (only if pipeline failed — workspace preserved)
tylt logs rpg-2024 <step-id>

# Check workspace step status
tylt show rpg-2024
```

## Repository Structure

```
pipeline.yaml      # Tylt pipeline definition (8 steps)
config.yaml        # Millesimes/URLs, layer mapping reference, tippecanoe options
.env.example       # Environment variable template (copy to .env)
scripts/
  setup.py         # Reads config.yaml, resolves download URL, writes config.env
  discover.sh      # Detects single .7z vs multi-part .7z.001+ archive
  download.sh      # Parallel download with curl
  fetch-bio.sh     # Fetches RPG BIO GPKG (IGN extract or data.gouv.fr API fallback)
  convert.sh       # ogr2ogr conversion LAMB93→WGS84; PAC GPKG (glob *_pac*.gpkg)
                   #   → parcelles.fgb, BIO GPKG (fixed path bio.gpkg) →
                   #   parcellesbio.fgb; handles IGN and data.gouv.fr BIO schemas;
                   #   field name normalization to lowercase
  build.sh         # tippecanoe invocation to build PMTiles
  upload.sh        # S3 upload with awscli
```

## Pipeline Steps

| Step            | Tool/Image                     | Key Output                                     |
| --------------- | ------------------------------ | ---------------------------------------------- |
| `setup`         | python + pyyaml                | `/output/config.env`                           |
| `discover`      | alpine                         | `/output/parts.txt`                            |
| `download`      | alpine + curl                  | `/output/download/*.7z*`                       |
| `extract`       | shell + p7zip-full             | `/output/*.gpkg`                               |
| `fetch-bio`     | osgeo/gdal + curl              | `/output/bio.gpkg` (or `.no-bio`)              |
| `convert`       | osgeo/gdal                     | `/output/*.fgb`                                |
| `build-pmtiles` | ubuntu:latest + apt tippecanoe | `/output/{MILLESIME}/parcelles_france.pmtiles` |
| `upload`        | shell + awscli                 | S3 object                                      |

## Important Conventions

- Shell scripts use `set -e` — any failing command aborts the step
- Step inputs/outputs flow through `/input/<step-id>/` and `/output/` inside containers
- GeoPackage layer → PMTiles source-layer mapping is explicit in `convert.sh`:
  PAC GPKG (located by glob `*_pac*.gpkg`) → `parcelles`, BIO GPKG (fixed path `bio.gpkg`) → `parcellesbio`
- The layer name within each GPKG is detected dynamically via `ogrinfo` (first layer listed)
- Field names vary across millesimes (UPPERCASE pre-2024, lowercase 2024+) — `convert.sh`
  normalizes all field names to lowercase via a dynamic SQL SELECT built from `ogrinfo`
- Layers absent from a given millesime are silently omitted from the PMTiles (no error);
  a warning is printed if the critical `parcelles` layer is missing
- `config.env` written by `setup` is sourced by downstream steps via Tylt `inputs`
- **RPG BIO fallback**: `fetch-bio` checks the IGN extract first; if absent, queries
  the data.gouv.fr API (`dataset 616d6531c2951bbe8bd97771`) to download the national
  GPKG (2021+) or SHP (2019-2020). If unavailable for the requested millesime,
  a `.no-bio` marker is written and `parcellesbio` is omitted from the PMTiles.

## Known Pitfalls

- The PAC GPKG is located by filename glob (`*_pac*.gpkg` or `parcelles_graphiques.gpkg`) — the layer name inside the GPKG is read dynamically via `ogrinfo`, not hardcoded
- The archive may be `.7z` (older years) or `.7z.001+` (recent years) — `discover.sh` handles both
- Tylt is required (no native Docker fallback) — verify with `tylt --version`

## Adding a New Millesime

Edit `config.yaml` and add an entry under `millesimes` with the `version` and `base_url` fields.
No code changes required.

## Required Environment Variables

| Variable               | Description                   |
| ---------------------- | ----------------------------- |
| `MILLESIME`            | Year to process (e.g. `2024`) |
| `S3_ENDPOINT`          | S3-compatible endpoint URL    |
| `S3_REGION`            | S3 region                     |
| `S3_BUCKET`            | Destination bucket name       |
| `S3_KEY`               | Object key path in bucket     |
| `S3_ACCESS_KEY_ID`     | S3 access key                 |
| `S3_SECRET_ACCESS_KEY` | S3 secret key                 |
