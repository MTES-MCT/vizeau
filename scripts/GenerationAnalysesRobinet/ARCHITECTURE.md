# Architecture Technique

Documentation complète des modules, colonnes et fonctions de transformation.

## 📦 Structure des fichiers

```
├── orchestrator.mjs          # Script principal, pipeline de traitement
├── utils.mjs                 # Utilitaires CSV (parsing, normalisation)
├── config.mjs                # Configurations centralisées
├── README.md                 # Documentation utilisateur
├── ARCHITECTURE.md           # Ce fichier
└── workdir/                  # Répertoire de données
    ├── CAP_PLV_*.csv         # Métadonnées prélèvement
    ├── CAP_RES_*.csv         # Résultats analyses
    ├── reference_qualite.csv # Libellés paramètres
    └── ...
```

---

## 📂 Modules

### `orchestrator.mjs` (Principal)

Orchestre le pipeline complet du traitement. Les phases principales sont :

1. **Découverte** (`discoverFiles`) : Localise fichiers PLV/RES et charge référentiels
2. **Filtrage/Tri** (`filterAndSort`) : Réduit colonnes, trie par `referenceprel`
3. **Fusion** (`mergeJoin`) : Joint PLV ↔ RES par clé commune / periode
4. **Transformations** : Renommage, nettoyage, enrichissement
5. **Export Parquet** (`csvToParquet`) : Génère fichier typé via PyArrow

#### Phases principales

```
PLV + RES sources
    ↓ [discoverFiles]
Fichiers triés + Référentiels chargés
    ↓ [filterAndSort]
Fichiers filtrés, colonnes réduites, triés
    ↓ [mergeJoin]
Fichier fusionné (une ligne par analyse)
    ↓ [Transformations en cascade]
- Renommage colonnes
- Nettoyage types
- Enrichissement (libellés, seuils, etc.)
    ↓ [csvToParquet]
Fichier Parquet typé
```

### `utils.mjs` (Utilitaires)

#### `checkFileExists(filePath)`

Vérifie l'existence d'un fichier.

```js
checkFileExists('./data.csv') // Lance erreur si absent
```

#### `normalizeString(value)`

Normalise chaîne : minuscules, trim, suppression accents, espacements.

```js
normalizeString('Über  PLAGE') // → "uber plage"
```

#### `detectDelimiter(filePath)`

Auto-détecte le délimiteur CSV (`,` ou `;`).

```js
const delim = await detectDelimiter('data.csv') // → ";" ou ","
```

### `config.mjs` (Configuration)

#### Patterns de fichiers

```js
PLV_SOURCE_PATTERN = /^CAP_PLV_(\d+)\.(csv|txt)$/i
RES_SOURCE_PATTERN = /^CAP_RES_(\d+)\.(csv|txt)$/i
```

#### Colonnes conservées

```js
COLUMNS_TO_KEEP_PLV = [
  'inseecommune',
  'nomcommune',
  'cdreseau',
  'nomreseau',
  'codetypeinstallation',
  'nomtypeinstallation',
  'referenceprel',
  'dateprel',
  'heureprel',
  'plvconformiterefbacterio',
  'plvconformiterefchimique',
  'codebrgm',
  'codebss',
  'coord_x',
  'coord_y',
]

COLUMNS_TO_KEEP_RES = [
  'referenceprel',
  'cdparametre',
  'rqana',
  'rsana',
  'cdunitereferencesiseeaux',
  'cdunitereference',
]
```

#### Mapping colonnes (Source → Standard)

```js
COLUMN_RENAME_MAP = {
  inseecommune: "code_insee",
  nomcommune: "nom_commune",
  cdreseau: "code_installation",
  ... (voir config.mjs)
}
```

#### Schéma Parquet (Types)

```js
PARQUET_FIELD_TYPES = {
  code_insee: { type: "UTF8" },
  nom_commune: { type: "UTF8" },
  date_prelevement: { type: "DATE" },
  longitude: { type: "DOUBLE" },
  ... (voir config.mjs)
}
```

---

## 🔄 Fonctions de transformation

### Type Coercion

**`toNumberValue(v)`** — Convertit en décimal

```js
toNumberValue('3.14') // → 3.14
toNumberValue(null) // → null
```

### Nettoyage des seuils

**`normalizeThresholdNumber(value)`** — Harmonise nombres (`.` vs `,`)

```js
normalizeThresholdNumber('3,14') // → "3,14"
normalizeThresholdNumber('3.14') // → "3,14"
```

**`normalizeThresholdUnit(rawUnit)`** — Harmonise unités

```js
normalizeThresholdUnit('µS / cm') // → "µS/cm"
normalizeThresholdUnit('°  C') // → "°C"
```

**`formatLimiteQualite(value)`** — Normalise limites de qualité

```js
formatLimiteQualite('<=100 µS/cm') // → "<=100 µS/cm"
formatLimiteQualite('< 100') // → "<= 100"
```

**`formatReferenceQualite(value)`** — Normalise références de qualité

```js
formatReferenceQualite('200 µS/cm') // → "<=200 µS/cm"
formatReferenceQualite('100-500 ppm') // → ">=100 et <=500 ppm"
```

---

## 📊 Mappages des colonnes

### Colonnes sources (PLV)

| Source                   | Description                   | Sortie                        |
| ------------------------ | ----------------------------- | ----------------------------- |
| inseecommune             | Code INSEE commune            | code_insee (UTF8)             |
| nomcommune               | Libellé commune               | nom_commune (UTF8)            |
| cdreseau                 | Identifiant de l'installation | code_installation (UTF8)      |
| nomreseau                | Nom de l'installation         | nom_installation (UTF8)       |
| codetypeinstallation     | Code type d'installation      | code_type_installation (UTF8) |
| nomtypeinstallation      | Libellé type                  | nom_type_installation (UTF8)  |
| dateprel                 | Date prélèvement              | date_prelevement (DATE)       |
| heureprel                | Heure prélèvement             | heure_prelevement (UTF8)      |
| plvconformiterefbacterio | Conformité bactériologique    | conformite_bacterio (UTF8)    |
| plvconformiterefchimique | Conformité chimique           | conformite_chimique (UTF8)    |
| codebrgm                 | Code BRGM                     | code_brgm (UTF8)              |
| codebss                  | Code BSS                      | code_bss (UTF8)               |
| coord_x                  | Longitude                     | longitude (DOUBLE)            |
| coord_y                  | Latitude                      | latitude (DOUBLE)             |

### Colonnes sources (RES)

| Source                   | Description              | Sortie                       |
| ------------------------ | ------------------------ | ---------------------------- |
| referenceprel            | Référence du prélèvement | referenceprel (UTF8)         |
| cdparametre              | Code paramètre           | code_parametre (DOUBLE)      |
| rqana                    | Résultat brut            | resultat (UTF8)              |
| rsana                    | Résultat traduction      | resultat_traduction (DOUBLE) |
| cdunitereferencesiseeaux | Code unité               | code_unite (UTF8)            |
| cdunitereference         | Code unité SANDRE        | code_unite_sandre (DOUBLE)   |

### Colonnes enrichies

| Colonne             | Source                      | Type    |
| ------------------- | --------------------------- | ------- |
| libelle_parametre   | parametres.json             | UTF8    |
| limite_qualite      | limite_qualite.csv          | UTF8    |
| reference_qualite   | reference_qualite.csv       | UTF8    |
| fonction            | substances_par_fonction.csv | UTF8    |
| captage_prioritaire | captages_prioritaires.csv   | BOOLEAN |

---

## 🔗 Fusion et clés

### Clé de fusion : `referenceprel`

La fusion PLV ↔ RES s'effectue sur le champ `referenceprel` présent dans les deux fichiers :

- **PLV** : 1 ligne par prélèvement (métadonnées)
- **RES** : N lignes par prélèvement (un paramètre par ligne)
- **Fusion** : M lignes par prélèvement (cartésien PLV × RES)

```
PLV : referenceprel="REF123" → 1 ligne
RES : referenceprel="REF123" → 3 analyses
Fusion : 3 lignes (REF123 × 3 paramètres)
```

---

## 🛠️ Options de parsing

Par défaut, les fichiers sont parsés avec tolérance aux malformations :

```js
getParseOptions(delimiter) // retourne
{
  columns: true,
  delimiter,
  skip_empty_lines: true,
  relax_column_count: true,
  relax_quotes: true
}
```

---

## 📝 Fichiers de référence

| Fichier                       | Format                    | Usage                                    |
| ----------------------------- | ------------------------- | ---------------------------------------- |
| `reference_qualite.csv`       | 2 colonnes (clé, libellé) | Enrichit `libelle_parametre`             |
| `limite_qualite.csv`          | 2 colonnes (clé, seuil)   | Calcul `limite_qualite`                  |
| `parametres.json`             | JSON array                | Enrichit `libelle_parametre`, `fonction` |
| `substances_par_fonction.csv` | 2 colonnes                | Cherche `fonction` par substance         |
| `captages_prioritaires.csv`   | (CodeBss)                 | Marque `captage_prioritaire`             |
| `ref_cap_*.csv`               | (coord)                   | Complète lon/lat manquantes              |

---

## 🐍 Script Python (PyArrow)

Embarqué dans `orchestrator.mjs`, le script Python :

1. Lit CSV par lots (100k lignes)
2. Applique type casting strict
3. Écrit Parquet avec compression Snappy
4. Utilise PyArrow pour schéma typé

**Détection délimiteur** : `;` si `count(;) > count(,)`, sinon `,`

**Coercion par colonne** : Fonctions `safe_int()`, `safe_float()`, `safe_date()`, etc.

**Batch size** : 100k lignes/batch, 1 048 576 lignes/row group

---

## 🔍 Heuristiques de recherche

### `findReferenceValue(map, value)`

Cherche référence avec tolérance :

1. **Normalise** : `normalizeString(value)`
2. **Exact match** : Cherche clé directe
3. **Substring match** : Cherche clé comme sous-chaîne (min 3 char)
4. **Retorno** : Chaîne vide si pas trouvé

Exemple :

```js
const map = new Map([
  ['acide carbonique', 'CO2'],
  ['ph', 'pH'],
])

findReferenceValue(map, 'ACIDE  CARBONIQUE') // → "CO2"
findReferenceValue(map, 'Acidité') // → "" (non trouvé)
```

---

## 📈 Performance

- **Streaming** : Traite fichiers > 1GB sans charger entièrement en mémoire
- **Tri temporaire** : Fichiers triés par `referenceprel` pour fusion efficace
- **Batch Parquet** : 100k lignes/batch pour stabilité mémoire
- **Délimiteur auto** : Détecte `;` vs `,` sans config externe

---

## 🐛 Logging et débogage

Émojis de statut console :

- ✅ Succès complet
- ❌ Erreur critique
- ⚠️ Avertissement non-bloquant
- 📊 Informations (découverte, étapes)
- ✓ Succès partiel (ex: 12 lignes fusionnées)

Chaque étape log le nombre de lignes traitées et la taille fichier.

---

## 🔐 Gestion d'erreur

- **Fichier manquant** : Erreur explicite avec chemin attendu
- **CSV malformé** : Tollance via `relax_*` flags
- **Encoding** : UTF-8 par défaut, BOM strippé
- **Type cast échoué** : Valeur `null`, pas levée exception
- **PyArrow indisponible** : Message clair sur commande Python

---

## 📚 Cas d'usage d'enrichissement

### 1. Ajouter libellé paramètre

Cherche dans `parametres.json` ou `reference_qualite.csv` par `code_parametre`.

### 2. Calculer limite qualité

Cherche dans `limite_qualite.csv` par libellé ou fonction, normalise format.

### 3. Déduire fonction

Cherche dans `substances_par_fonction.csv` en matching substring sur `libelle_parametre`.

### 4. Marquer captages prioritaires

Compare `code_bss` ligne avec liste de `captages_prioritaires.csv`, retourne booléen.

### 5. Compléter coordonnées

Fusionne sur `code_installation` avec `ref_cap_*.csv` pour lon/lat manquantes.

---

## 🎯 Schéma de sortie Parquet (complet)

```
┌───────────────────────────────────────────┐
│         SCHEMA PARQUET FINAL              │
├───────────────────────────────────────────┤
│ code_insee: string                        │
│ nom_commune: string                       │
│ code_installation: string                 │
│ nom_installation: string                  │
│ code_type_installation: string            │
│ nom_type_installation: string             │
│ date_prelevement: date32                  │
│ heure_prelevement: string                 │
│ conformite_bacterio: string               │
│ conformite_chimique: string               │
│ code_brgm: string                         │
│ code_bss: string                          │
│ longitude: double                         │
│ latitude: double                          │
│ code_parametre: double                    │
│ resultat: string                          │
│ resultat_traduction: double               │
│ code_unite: string                        │
│ code_unite_sandre: double                 │
│ libelle_parametre: string (enrichi)       │
│ limite_qualite: string (enrichi)          │
│ reference_qualite: string (enrichi)       │
│ captage_prioritaire: bool (enrichi)       │
│ fonction: string (enrichi)                │
└───────────────────────────────────────────┘
```

---

**Voir aussi** :

- [`README.md`](README.md) pour utilisation,
- [`config.mjs`](config.mjs) pour configurations,
- [`orchestrator.mjs`](orchestrator.mjs) pour implémentation.
