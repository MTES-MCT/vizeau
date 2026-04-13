#!/bin/bash
# Lance la pipeline RPG → PMTiles pour un millésime donné,
# puis nettoie le workspace Tylt après un upload réussi.
#
# Usage :
#   ./run.sh 2024
#   ./run.sh 2023 --target build-pmtiles   # sans upload S3
#   ./run.sh 2022 --force download          # re-télécharger
MILLESIME="${1:?Usage: ./run.sh <MILLESIME> [options tylt supplémentaires]}"
shift

WORKSPACE="rpg-${MILLESIME}"
ENV_FILE=".env"

if [ ! -f "$ENV_FILE" ]; then
    echo "Erreur : fichier $ENV_FILE introuvable." >&2
    echo "Copier .env.example → .env et renseigner les credentials S3." >&2
    exit 1
fi

# Fichier env temporaire : credentials de base + MILLESIME dynamique
TMP_ENV=$(mktemp)
trap 'rm -f "$TMP_ENV"' EXIT

grep -v "^MILLESIME=\|^S3_KEY=" "$ENV_FILE" > "$TMP_ENV"
echo "MILLESIME=${MILLESIME}" >> "$TMP_ENV"
echo "S3_KEY=${MILLESIME}/parcelles_france.pmtiles" >> "$TMP_ENV"

echo "▶ Millésime : ${MILLESIME}  |  Workspace : ${WORKSPACE}"
echo ""

tylt run --env-file "$TMP_ENV" --workspace "$WORKSPACE" "$@"
PIPELINE_STATUS=$?

if [ $PIPELINE_STATUS -eq 0 ]; then
    echo ""
    echo "✓ Pipeline terminée. Nettoyage du workspace ${WORKSPACE}…"
    tylt rm "$WORKSPACE" 2>/dev/null && echo "✓ Workspace supprimé."
else
    echo ""
    echo "✗ Pipeline échouée (code $PIPELINE_STATUS). Workspace conservé pour debug : ${WORKSPACE}"
    echo "  → tylt show ${WORKSPACE}"
    echo "  → tylt logs ${WORKSPACE} <étape>"
    exit $PIPELINE_STATUS
fi
