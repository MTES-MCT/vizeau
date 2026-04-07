#!/usr/bin/env python3
"""
Étape setup : lit config.yaml et produit /output/config.env
avec BASE_URL et MILLESIME pour le millésime demandé.
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

os.makedirs('/output', exist_ok=True)

with open('/output/config.env', 'w') as f:
    f.write(f'BASE_URL={base_url}\n')
    f.write(f'MILLESIME={millesime}\n')

print(f"Millésime   : {millesime}")
print(f"BASE_URL    : {base_url}")
print(f"config.env  : /output/config.env")
