import { has } from 'lodash-es'
import { groupColors } from '~/utils/group-colors'
import cultures from '../../database/data/cultures.json'

export type GroupeCulturauxItem = {
  label: string
  code_group: number | string
  color: string
}

export const GROUPES_CULTURAUX: { [key: string]: GroupeCulturauxItem } = {
  1: {
    label: 'Blé tendre',
    code_group: 1,
    color: groupColors[1],
  },
  2: {
    label: 'Maïs grain et ensilage',
    code_group: 2,
    color: groupColors[2],
  },
  3: {
    label: 'Orge',
    code_group: 3,
    color: groupColors[3],
  },
  4: {
    label: 'Autres céréales',
    code_group: 4,
    color: groupColors[4],
  },
  5: {
    label: 'Colza',
    code_group: 5,
    color: groupColors[5],
  },
  6: {
    label: 'Tournesol',
    code_group: 6,
    color: groupColors[6],
  },
  7: {
    label: 'Autre oléagineux',
    code_group: 7,
    color: groupColors[7],
  },
  8: {
    label: 'Protéagineux',
    code_group: 8,
    color: groupColors[8],
  },
  9: {
    label: 'Plantes à fibres',
    code_group: 9,
    color: groupColors[9],
  },
  10: {
    label: 'Semences',
    code_group: 10,
    color: groupColors[10],
  },
  11: {
    label: 'Gel',
    code_group: 11,
    color: groupColors[11],
  },
  12: {
    label: 'Gel industriel',
    code_group: 12,
    color: groupColors[12],
  },
  13: {
    label: 'Autres gels',
    code_group: 13,
    color: groupColors[13],
  },
  14: {
    label: 'Riz',
    code_group: 14,
    color: groupColors[14],
  },
  15: {
    label: 'Légumineux à grains',
    code_group: 15,
    color: groupColors[15],
  },
  16: {
    label: 'Fourrage',
    code_group: 16,
    color: groupColors[16],
  },
  17: {
    label: 'Estives et landes',
    code_group: 17,
    color: groupColors[17],
  },
  18: {
    label: 'Prairies permanentes',
    code_group: 18,
    color: groupColors[18],
  },
  19: {
    label: 'Prairies temporaires',
    code_group: 19,
    color: groupColors[19],
  },
  20: {
    label: 'Vergers',
    code_group: 20,
    color: groupColors[20],
  },
  21: {
    label: 'Vignes',
    code_group: 21,
    color: groupColors[21],
  },
  22: {
    label: 'Fruits à coque',
    code_group: 22,
    color: groupColors[22],
  },
  23: {
    label: 'Oliviers',
    code_group: 23,
    color: groupColors[23],
  },
  24: {
    label: 'Autres cultures industrielles',
    code_group: 24,
    color: groupColors[24],
  },
  25: {
    label: 'Légumes ou fleurs',
    code_group: 25,
    color: groupColors[25],
  },
  26: {
    label: 'Canne à sucre',
    code_group: 26,
    color: groupColors[26],
  },
  27: {
    label: 'Arboriculture',
    code_group: 27,
    color: groupColors[27],
  },
  28: {
    label: 'Divers - non disponible',
    code_group: 28,
    color: groupColors[28],
  },
}

export function getCulturesGroup(code: string | number) {
  if (!has(GROUPES_CULTURAUX, code)) {
    return GROUPES_CULTURAUX[28]
  }
  return GROUPES_CULTURAUX[code]
}

/** Retourne la couleur correspondant à un code_group (source : groupColors). */
export function getCultureColor(code_group: string | number | null | undefined): string {
  if (code_group === null || code_group === undefined) return groupColors[28]
  const key = Number(code_group) as keyof typeof groupColors
  return groupColors[key] || groupColors[28]
}

export function getCultureByCode(code: string | null | undefined): {
  label: string
  color: string
} {
  const culture = cultures.find((c) => c.code === code)
  return {
    label: culture?.label || 'Culture inconnue',
    color: getCultureColor(culture?.code_group),
  }
}
