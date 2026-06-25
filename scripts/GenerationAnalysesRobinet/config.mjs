/**
 * Configuration centralisée du pipeline Qualité Eau
 * Contient les mappages de colonnes, patterns et schémas Parquet
 */

// Patterns de fichiers sources
export const PLV_SOURCE_PATTERN = /^CAP_PLV_(\d+)\.(csv|txt)$/i
export const RES_SOURCE_PATTERN = /^CAP_RES_(\d+)\.(csv|txt)$/i

// Colonnes à conserver pour chaque type
export const COLUMNS_TO_KEEP_PLV = [
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

export const COLUMNS_TO_KEEP_RES = [
  'referenceprel',
  'cdparametre',
  'rqana',
  'rsana',
  'cdunitereferencesiseeaux',
  'cdunitereference',
]

// Mapping des colonnes sources → noms standardisés
export const COLUMN_RENAME_MAP = {
  inseecommune: 'code_insee',
  nomcommune: 'nom_commune',
  cdreseau: 'code_installation',
  nomreseau: 'nom_installation',
  codetypeinstallation: 'code_type_installation',
  nomtypeinstallation: 'nom_type_installation',
  dateprel: 'date_prelevement',
  heureprel: 'heure_prelevement',
  plvconformiterefbacterio: 'conformite_bacterio',
  plvconformiterefchimique: 'conformite_chimique',
  codebrgm: 'code_brgm',
  codebss: 'code_bss',
  coord_x: 'longitude',
  coord_y: 'latitude',
  cdparametre: 'code_parametre',
  rqana: 'resultat',
  rsana: 'resultat_traduction',
  cdunitereferencesiseeaux: 'code_unite',
  cdunitereference: 'code_unite_sandre',
}

// Schéma Parquet avec types et fonctions de coercion
export const PARQUET_FIELD_TYPES = {
  code_insee: { type: 'UTF8' },
  nom_commune: { type: 'UTF8' },
  code_installation: { type: 'UTF8' },
  nom_installation: { type: 'UTF8' },
  code_type_installation: { type: 'UTF8' },
  nom_type_installation: { type: 'UTF8' },
  date_prelevement: { type: 'DATE' },
  heure_prelevement: { type: 'UTF8' },
  conformite_bacterio: { type: 'UTF8' },
  conformite_chimique: { type: 'UTF8' },
  code_brgm: { type: 'UTF8' },
  code_bss: { type: 'UTF8' },
  longitude: { type: 'DOUBLE' },
  latitude: { type: 'DOUBLE' },
  code_parametre: { type: 'DOUBLE' },
  resultat: { type: 'UTF8' },
  resultat_traduction: { type: 'DOUBLE' },
  code_unite: { type: 'UTF8' },
  code_unite_sandre: { type: 'DOUBLE' },
  libelle_parametre: { type: 'UTF8' },
  limite_qualite: { type: 'UTF8' },
  reference_qualite: { type: 'UTF8' },
  captage_prioritaire: { type: 'BOOLEAN' },
  fonction: { type: 'UTF8' },
}
