# Générateur des données de Qualité Eau

Un script Node.js pour traiter et normaliser la génération des données de qualité de l'eau à partir de fichiers _"Résultats du contrôle sanitaire de l'eau du robinet"_

## 📋 Fonctionnalités

- **Traitement optimisé** : Gestion du streaming pour fichiers > 1 GB
- **Normalisation robuste** : Détection auto des délimiteurs, nettoyage des accents
- **Fusion intelligente** : Joint PLV (métadonnées) + RES (analyses) par référence
- **Enrichissement** : Ajoute paramètres, limites de qualité, captages prioritaires
- **Parquet natif** : Export via PyArrow pour schéma typé et compression

## 🚀 Utilisation

```bash
npm install
node orchestrator.mjs <répertoire_d'entrée> [fichier_sortie.parquet]
```

**Exemple:**

```bash
node orchestrator.mjs ./workdir ./output.parquet
```

## 📂 Fichiers d'entrée

**Fichiers obligatoires :**

- `CAP_PLV_****.txt` — Métadonnées de prélèvement
- `CAP_RES_****.txt` — Résultats d'analyses
  _Source : [data.gouv.fr](https://www.data.gouv.fr/datasets/resultats-du-controle-sanitaire-de-leau-du-robinet)_

**Fichiers de référence :**

- `reference_qualite.csv` — Qualité de référence
- `limite_qualite.csv` — Seuils de qualité
- `parametres.json` — Code paramètres => libellé des substances
- `substances_par_fonction.csv` — Fonctions / familles des substances
- `captages_prioritaires.csv` — Captages prioritaires
- `ref_cap_*.csv` — Coordonnées de certaines installations
  _Source : Inconnue, transmis par l'intrapreuneuse_

> Ces fichiers sont stockés sur le bucket S3 `aac-workfiles/Fichiers_pour_analyses`

Voir [`ARCHITECTURE.md`](ARCHITECTURE.md) pour détails techniques complets.
