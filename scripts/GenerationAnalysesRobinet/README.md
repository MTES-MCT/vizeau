# Générateur des données de Qualité Eau

Un script Node.js pour traiter et normaliser la génération des données de qualité de l'eau à partir de fichiers _"Résultats du contrôle sanitaire de l'eau du robinet"_

## 📋 Fonctionnalités

- **Traitement optimisé** : Pipeline pensé pour les fichiers > 1 GB sans charger tout en mémoire
- **Normalisation robuste** : Détection auto des délimiteurs, nettoyage des accents
- **Fusion intelligente** : Joint PLV (métadonnées) + RES (analyses) par référence
- **Enrichissement** : Ajoute paramètres, limites de qualité, captages prioritaires
- **Parquet natif** : Export via PyArrow pour schéma typé et compression

## ⚙️ Optimisations mémoire et performance

- `detectDelimiter()` lit uniquement un échantillon (64 KB) du début du fichier pour déterminer le délimiteur, au lieu de lire le fichier complet.
- `filterAndSort()` fait un tri externe sur disque : filtrage en flux, écriture temporaire, tri via `sort`, puis reconstruction du CSV trié.
- `mergeJoin()` fait une vraie fusion ordonnée en flux entre PLV et RES (deux pointeurs sur fichiers triés), sans indexer tout RES en mémoire.
- `findReferenceValue()` ne reconstruit plus de RegExp à chaque itération et utilise seulement les tests d'inclusion, ce qui réduit le coût CPU.

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
  _Source : Inconnue, transmis par l'intrapreneuse_

> Ces fichiers sont stockés sur le bucket S3 `aac-workfiles/Fichiers_pour_analyses`

Voir [`ARCHITECTURE.md`](ARCHITECTURE.md) pour détails techniques complets.
