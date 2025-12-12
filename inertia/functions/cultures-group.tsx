import { has } from 'lodash-es'
import tinycolor from 'tinycolor2'

import { useIsLightTheme } from '~/hooks/use-is-light'

export type GroupeCulturauxItem = {
  label: string
  code_group: number | string
  picto_light: string
  picto_dark: string
  color: string
}

export const GROUPES_CULTURAUX: { [key: string]: GroupeCulturauxItem } = {
  1: {
    label: 'Blé tendre',
    code_group: 1,
    picto_light: '/public/cultures-pictos/light/groupe-1.png',
    picto_dark: '/public/cultures-pictos/dark/groupe-1.png',
    color: '#FDFF8E',
  },
  2: {
    label: 'Maïs grain et ensilage',
    code_group: 2,
    picto_light: '/public/cultures-pictos/light/groupe-2.png',
    picto_dark: '/public/cultures-pictos/dark/groupe-2.png',
    color: '#00FC07',
  },
  3: {
    label: 'Orge',
    code_group: 3,
    picto_light: '/public/cultures-pictos/light/groupe-3.png',
    picto_dark: '/public/cultures-pictos/dark/groupe-3.png',
    color: '#F0FF62',
  },
  4: {
    label: 'Autres céréales',
    code_group: 4,
    picto_light: '/public/cultures-pictos/light/groupe-4.png',
    picto_dark: '/public/cultures-pictos/dark/groupe-4.png',
    color: '#DAEB02',
  },
  5: {
    label: 'Colza',
    code_group: 5,
    picto_light: '/public/cultures-pictos/light/groupe-5.png',
    picto_dark: '/public/cultures-pictos/dark/groupe-5.png',
    color: '#FFECB2',
  },
  6: {
    label: 'Tournesol',
    code_group: 6,
    picto_light: '/public/cultures-pictos/light/groupe-6.png',
    picto_dark: '/public/cultures-pictos/dark/groupe-6.png',
    color: '#FFFF00',
  },
  7: {
    label: 'Autre oléagineux',
    code_group: 7,
    picto_light: '/public/cultures-pictos/light/groupe-7.png',
    picto_dark: '/public/cultures-pictos/dark/groupe-7.png',
    color: '#FDC103',
  },
  8: {
    label: 'Protéagineux',
    code_group: 8,
    picto_light: '/public/cultures-pictos/light/groupe-8.png',
    picto_dark: '/public/cultures-pictos/dark/groupe-8.png',
    color: '#F0B401',
  },
  9: {
    label: 'Plantes à fibres',
    code_group: 9,
    picto_light: '/public/cultures-pictos/light/groupe-9.png',
    picto_dark: '/public/cultures-pictos/dark/groupe-9.png',
    color: '#BB9200',
  },
  10: {
    label: 'Semences',
    code_group: 10,
    picto_light: '/public/cultures-pictos/light/groupe-10.png',
    picto_dark: '/public/cultures-pictos/dark/groupe-10.png',
    color: '#624700',
  },
  11: {
    label: 'Gel',
    code_group: 11,
    picto_light: '/public/cultures-pictos/light/groupe-11.png',
    picto_dark: '/public/cultures-pictos/dark/groupe-11.png',
    color: '#F0F0F0',
  },
  12: {
    label: 'Gel industriel',
    code_group: 12,
    picto_light: '/public/cultures-pictos/light/groupe-12.png',
    picto_dark: '/public/cultures-pictos/dark/groupe-12.png',
    color: '#B0B0B0',
  },
  13: {
    label: 'Autres gels',
    code_group: 13,
    picto_light: '/public/cultures-pictos/light/groupe-13.png',
    picto_dark: '/public/cultures-pictos/dark/groupe-13.png',
    color: '#D0D0D0',
  },
  14: {
    label: 'Riz',
    code_group: 14,
    picto_light: '/public/cultures-pictos/light/groupe-14.png',
    picto_dark: '/public/cultures-pictos/dark/groupe-14.png',
    color: '#8FB5FE',
  },
  15: {
    label: 'Légumineux à grains',
    code_group: 15,
    picto_light: '/public/cultures-pictos/light/groupe-15.png',
    picto_dark: '/public/cultures-pictos/dark/groupe-15.png',
    color: '#FFA07D',
  },
  16: {
    label: 'Fourrage',
    code_group: 16,
    picto_light: '/public/cultures-pictos/light/groupe-16.png',
    picto_dark: '/public/cultures-pictos/dark/groupe-16.png',
    color: '#A0C75D',
  },
  17: {
    label: 'Estives et landes',
    code_group: 17,
    picto_light: '/public/cultures-pictos/light/groupe-17.png',
    picto_dark: '/public/cultures-pictos/dark/groupe-17.png',
    color: '#B5E56D',
  },
  18: {
    label: 'Prairies permanentes',
    code_group: 18,
    picto_light: '/public/cultures-pictos/light/groupe-18.png',
    picto_dark: '/public/cultures-pictos/dark/groupe-18.png',
    color: '#BFFF60',
  },
  19: {
    label: 'Prairies temporaires',
    code_group: 19,
    picto_light: '/public/cultures-pictos/light/groupe-19.png',
    picto_dark: '/public/cultures-pictos/dark/groupe-19.png',
    color: '#E0FFB3',
  },
  20: {
    label: 'Vergers',
    code_group: 20,
    picto_light: '/public/cultures-pictos/light/groupe-20.png',
    picto_dark: '/public/cultures-pictos/dark/groupe-20.png',
    color: '#FE0100',
  },
  21: {
    label: 'Vignes',
    code_group: 21,
    picto_light: '/public/cultures-pictos/light/groupe-21.png',
    picto_dark: '/public/cultures-pictos/dark/groupe-21.png',
    color: '#DF00E4',
  },
  22: {
    label: 'Fruits à coque',
    code_group: 22,
    picto_light: '/public/cultures-pictos/light/groupe-22.png',
    picto_dark: '/public/cultures-pictos/dark/groupe-22.png',
    color: '#008001',
  },
  23: {
    label: 'Oliviers',
    code_group: 23,
    picto_light: '/public/cultures-pictos/light/groupe-23.png',
    picto_dark: '/public/cultures-pictos/dark/groupe-23.png',
    color: '#9FA600',
  },
  24: {
    label: 'Autres cultures industrielles',
    code_group: 24,
    picto_light: '/public/cultures-pictos/light/groupe-24.png',
    picto_dark: '/public/cultures-pictos/dark/groupe-24.png',
    color: '#008081',
  },
  25: {
    label: 'Légumes ou fleurs',
    code_group: 25,
    picto_light: '/public/cultures-pictos/light/groupe-25.png',
    picto_dark: '/public/cultures-pictos/dark/groupe-25.png',
    color: '#FEA1CE',
  },
  26: {
    label: 'Canne à sucre',
    code_group: 26,
    picto_light: '/public/cultures-pictos/light/groupe-26.png',
    picto_dark: '/public/cultures-pictos/dark/groupe-26.png',
    color: '#0000FF',
  },
  27: {
    label: 'Arboriculture',
    code_group: 27,
    picto_light: '/public/cultures-pictos/light/groupe-27.png',
    picto_dark: '/public/cultures-pictos/dark/groupe-27.png',
    color: '#02B558',
  },
  28: {
    label: 'Divers - non disponible',
    code_group: 28,
    picto_light: '/public/cultures-pictos/light/groupe-28.png',
    picto_dark: '/public/cultures-pictos/dark/groupe-28.png',
    color: '#81017F',
  },
}

export function getCulturesGroup(code: string | number) {
  if (!has(GROUPES_CULTURAUX, code)) {
    return GROUPES_CULTURAUX[18]
  }
  return GROUPES_CULTURAUX[code]
}

export function getContrastedPicto(
  culture: { picto_light: string; picto_dark: string },
  background?: string
): string {
  const isLight = background ? tinycolor(background).isLight() : useIsLightTheme()

  return isLight ? culture.picto_light : culture.picto_dark
}
