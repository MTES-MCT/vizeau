#!/usr/bin/env python3
"""
Étape setup : lit config.yaml et produit /output/config.env
avec BASE_URL, MILLESIME, BIO_FALLBACK_DATASET, MIN_ZOOM et MAX_ZOOM.
"""
import os
import sys
import yaml

millesime = os.environ.get('MILLESIME', '')
if not millesime:
    print("Erreur : la variable MILLESIME n'est pas définie.", file=sys.stderr)
    print("Usage : tylt run --env MILLESIME=2024", file=sys.stderr)
    sys.exit(1)

with open('/config.yaml') as f:
    config = yaml.safe_load(f)

millesimes = config.get('millesimes', {})
if millesime not in millesimes:
    available = list(millesimes.keys())
    print(f"Erreur : millésime '{millesime}' absent de config.yaml", file=sys.stderr)
    print(f"Millésimes disponibles : {available}", file=sys.stderr)
    sys.exit(1)

entry = millesimes[millesime]
base_url = entry['base_url']

bio_fallback_dataset = config.get('bio_fallback_dataset', '')
tippecanoe = config.get('tippecanoe', {})
min_zoom = tippecanoe.get('min_zoom', 5)
max_zoom = tippecanoe.get('max_zoom', 14)

os.makedirs('/output', exist_ok=True)

with open('/output/config.env', 'w') as f:
    f.write(f'BASE_URL={base_url}\n')
    f.write(f'MILLESIME={millesime}\n')
    f.write(f'BIO_FALLBACK_DATASET={bio_fallback_dataset}\n')
    f.write(f'MIN_ZOOM={min_zoom}\n')
    f.write(f'MAX_ZOOM={max_zoom}\n')

print(f"Millésime            : {millesime}")
print(f"BASE_URL             : {base_url}")
print(f"BIO_FALLBACK_DATASET : {bio_fallback_dataset}")
print(f"MIN_ZOOM / MAX_ZOOM  : {min_zoom} / {max_zoom}")
print(f"config.env           : /output/config.env")
