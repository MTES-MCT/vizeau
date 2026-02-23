import { has } from 'lodash-es'

export type GroupeCulturauxItem = {
  label: string
  code_group: number | string
  color: string
}

export const GROUPES_CULTURAUX: { [key: string]: GroupeCulturauxItem } = {
  1: {
    label: 'Blé tendre',
    code_group: 1,
    color: '#FDFF8E',
  },
  2: {
    label: 'Maïs grain et ensilage',
    code_group: 2,
    color: '#00FC07',
  },
  3: {
    label: 'Orge',
    code_group: 3,
    color: '#F0FF62',
  },
  4: {
    label: 'Autres céréales',
    code_group: 4,
    color: '#DAEB02',
  },
  5: {
    label: 'Colza',
    code_group: 5,
    color: '#FFECB2',
  },
  6: {
    label: 'Tournesol',
    code_group: 6,
    color: '#FFFF00',
  },
  7: {
    label: 'Autre oléagineux',
    code_group: 7,
    color: '#FDC103',
  },
  8: {
    label: 'Protéagineux',
    code_group: 8,
    color: '#F0B401',
  },
  9: {
    label: 'Plantes à fibres',
    code_group: 9,
    color: '#BB9200',
  },
  10: {
    label: 'Semences',
    code_group: 10,
    color: '#624700',
  },
  11: {
    label: 'Gel',
    code_group: 11,
    color: '#F0F0F0',
  },
  12: {
    label: 'Gel industriel',
    code_group: 12,
    color: '#B0B0B0',
  },
  13: {
    label: 'Autres gels',
    code_group: 13,
    color: '#D0D0D0',
  },
  14: {
    label: 'Riz',
    code_group: 14,
    color: '#8FB5FE',
  },
  15: {
    label: 'Légumineux à grains',
    code_group: 15,
    color: '#FFA07D',
  },
  16: {
    label: 'Fourrage',
    code_group: 16,
    color: '#A0C75D',
  },
  17: {
    label: 'Estives et landes',
    code_group: 17,
    color: '#B5E56D',
  },
  18: {
    label: 'Prairies permanentes',
    code_group: 18,
    color: '#BFFF60',
  },
  19: {
    label: 'Prairies temporaires',
    code_group: 19,
    color: '#E0FFB3',
  },
  20: {
    label: 'Vergers',
    code_group: 20,
    color: '#FE0100',
  },
  21: {
    label: 'Vignes',
    code_group: 21,
    color: '#DF00E4',
  },
  22: {
    label: 'Fruits à coque',
    code_group: 22,
    color: '#008001',
  },
  23: {
    label: 'Oliviers',
    code_group: 23,
    color: '#9FA600',
  },
  24: {
    label: 'Autres cultures industrielles',
    code_group: 24,
    color: '#008081',
  },
  25: {
    label: 'Légumes ou fleurs',
    code_group: 25,
    color: '#FEA1CE',
  },
  26: {
    label: 'Canne à sucre',
    code_group: 26,
    color: '#0000FF',
  },
  27: {
    label: 'Arboriculture',
    code_group: 27,
    color: '#02B558',
  },
  28: {
    label: 'Divers - non disponible',
    code_group: 28,
    color: '#81017F',
  },
}

export function getCulturesGroup(code: string | number) {
  if (!has(GROUPES_CULTURAUX, code)) {
    return GROUPES_CULTURAUX[28]
  }
  return GROUPES_CULTURAUX[code]
}
