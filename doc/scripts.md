# Scripts

Les scripts du dossier `scripts` ne sont pas liés à AdonisJs et ne sont pas empaquetés dans l'application finale.
Ce sont des utilitaires NodeJs pour la maintenance et l'opération du projet.

## `flatten_json.js`

Lit un fichier JSON et génère une version sans espaces ni retours à la ligne, suffixée `_flattened.json`. Utile pour copier une valeur dans une variable d'environnement.

```bash
node flatten_json.js USERS_TO_SEED_1.json
# → génère USERS_TO_SEED_1_flattened.json
```

## Dossier `GenerationAnalysesRobinet`

Transforme les données d'analyses de l'eau
Cf [README.md](scripts/GenerationAnalysesRobinet/README.md)
