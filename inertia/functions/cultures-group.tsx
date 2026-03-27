import { has } from 'lodash-es'
import { groupColors } from '~/utils/group-colors'
import cultures from '../../database/data/cultures.json'

export type GroupeCulturauxItem = {
  label: string
  group_code: number | string
  color: string
}

export const GROUPES_CULTURAUX: { [key: string]: GroupeCulturauxItem } = {
  1: {
    label: 'Blé tendre',
    group_code: 1,
    color: groupColors[1],
  },
  2: {
    label: 'Maïs grain et ensilage',
    group_code: 2,
    color: groupColors[2],
  },
  3: {
    label: 'Orge',
    group_code: 3,
    color: groupColors[3],
  },
  4: {
    label: 'Autres céréales',
    group_code: 4,
    color: groupColors[4],
  },
  5: {
    label: 'Colza',
    group_code: 5,
    color: groupColors[5],
  },
  6: {
    label: 'Tournesol',
    group_code: 6,
    color: groupColors[6],
  },
  7: {
    label: 'Autre oléagineux',
    group_code: 7,
    color: groupColors[7],
  },
  8: {
    label: 'Protéagineux',
    group_code: 8,
    color: groupColors[8],
  },
  9: {
    label: 'Plantes à fibres',
    group_code: 9,
    color: groupColors[9],
  },
  10: {
    label: 'Semences',
    group_code: 10,
    color: groupColors[10],
  },
  11: {
    label: 'Gel',
    group_code: 11,
    color: groupColors[11],
  },
  12: {
    label: 'Gel industriel',
    group_code: 12,
    color: groupColors[12],
  },
  13: {
    label: 'Autres gels',
    group_code: 13,
    color: groupColors[13],
  },
  14: {
    label: 'Riz',
    group_code: 14,
    color: groupColors[14],
  },
  15: {
    label: 'Légumineux à grains',
    group_code: 15,
    color: groupColors[15],
  },
  16: {
    label: 'Fourrage',
    group_code: 16,
    color: groupColors[16],
  },
  17: {
    label: 'Estives et landes',
    group_code: 17,
    color: groupColors[17],
  },
  18: {
    label: 'Prairies permanentes',
    group_code: 18,
    color: groupColors[18],
  },
  19: {
    label: 'Prairies temporaires',
    group_code: 19,
    color: groupColors[19],
  },
  20: {
    label: 'Vergers',
    group_code: 20,
    color: groupColors[20],
  },
  21: {
    label: 'Vignes',
    group_code: 21,
    color: groupColors[21],
  },
  22: {
    label: 'Fruits à coque',
    group_code: 22,
    color: groupColors[22],
  },
  23: {
    label: 'Oliviers',
    group_code: 23,
    color: groupColors[23],
  },
  24: {
    label: 'Autres cultures industrielles',
    group_code: 24,
    color: groupColors[24],
  },
  25: {
    label: 'Légumes ou fleurs',
    group_code: 25,
    color: groupColors[25],
  },
  26: {
    label: 'Canne à sucre',
    group_code: 26,
    color: groupColors[26],
  },
  27: {
    label: 'Arboriculture',
    group_code: 27,
    color: groupColors[27],
  },
  28: {
    label: 'Divers - non disponible',
    group_code: 28,
    color: groupColors[28],
  },
}

const CULTURE_CATEGORY_COLORS: Record<string, string> = {
  'Céréales': groupColors[1],
  'Oléagineux': groupColors[5],
  'Protéagineux': groupColors[8],
  'Plantes à fibres': groupColors[9],
  'Semences': groupColors[10],
  'Gel / jachère': groupColors[11],
  'Légumineuses à grains': groupColors[15],
  'Fourragères annuelles': groupColors[16],
  'Fourragères (hors prairies)': groupColors[16],
  'Estives et landes': groupColors[17],
  'Prairies permanentes': groupColors[18],
  'Prairies temporaires': groupColors[19],
  'Vergers': groupColors[20],
  'Vignes': groupColors[21],
  'Fruits à coque': groupColors[22],
  'Autres cultures industrielles': groupColors[24],
  'Fleurs et horticulture': groupColors[25],
  'Agroforesterie': groupColors[27],
  'Divers': groupColors[28],
  'Surfaces non agricoles': groupColors[28],
  'Autres cultures permanentes': groupColors[27],
  'Tubercules et racines industrielles': groupColors[24],
}

export function getCultureCategoryColor(name: string): string {
  return CULTURE_CATEGORY_COLORS[name] ?? groupColors[28]
}

export function getCulturesGroup(code: string | number) {
  if (!has(GROUPES_CULTURAUX, code)) {
    return GROUPES_CULTURAUX[28]
  }
  return GROUPES_CULTURAUX[code]
}

/** Retourne la couleur correspondant à un group_code (source : groupColors). */
export function getCultureColor(group_code: string | number | null | undefined): string {
  if (group_code === null || group_code === undefined) return groupColors[28]
  const key = Number(group_code) as keyof typeof groupColors
  return groupColors[key] || groupColors[28]
}

export function getCultureByCode(code: string | null | undefined): {
  label: string
  color: string
} {
  const culture = cultures.find((c) => c.code === code)
  return {
    label: culture?.label || 'Culture inconnue',
    color: getCultureColor(culture?.groupCode),
  }
}

export function getCultureColorByLabel(name: string): string {
  const group = Object.values(GROUPES_CULTURAUX).find((g) => g.label === name)
  return group?.color ?? getCultureCategoryColor(name)
}
