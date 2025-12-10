import { has } from 'lodash-es'
import tinycolor from 'tinycolor2'

export type GroupeCulturauxItem = {
  label: string
  code: string
  picto_light: string
  picto_dark: string
  color: string
}

export const GROUPES_CULTURAUX: { [key: string]: GroupeCulturauxItem } = {
  BTH: {
    label: 'Blé tendre',
    code: 'BTH',
    picto_light: '/public/cultures-pictos/light/BTH.png',
    picto_dark: '/public/cultures-pictos/dark/BTH.png',
    color: '#FDFF8E',
  },
  MIG: {
    label: 'Maïs grain et ensilage',
    code: 'MIG',
    picto_light: '/public/cultures-pictos/light/MIG.png',
    picto_dark: '/public/cultures-pictos/dark/MIG.png',
    color: '#00FC07',
  },
  ORG: {
    label: 'Orge',
    code: 'ORG',
    picto_light: '/public/cultures-pictos/light/ORG.png',
    picto_dark: '/public/cultures-pictos/dark/ORG.png',
    color: '#F0FF62',
  },
  AUTC: {
    label: 'Autres céréales',
    code: 'AUTC',
    picto_light: '/public/cultures-pictos/light/AUTC.png',
    picto_dark: '/public/cultures-pictos/dark/AUTC.png',
    color: '#DAEB02',
  },
  COL: {
    label: 'Colza',
    code: 'COL',
    picto_light: '/public/cultures-pictos/light/COL.png',
    picto_dark: '/public/cultures-pictos/dark/COL.png',
    color: '#FFECB2',
  },
  TOU: {
    label: 'Tournesol',
    code: 'TOU',
    picto_light: '/public/cultures-pictos/light/TOU.png',
    picto_dark: '/public/cultures-pictos/dark/TOU.png',
    color: '#FFFF00',
  },
  AUL: {
    label: 'Autre oléagineux',
    code: 'AUL',
    picto_light: '/public/cultures-pictos/light/AUL.png',
    picto_dark: '/public/cultures-pictos/dark/AUL.png',
    color: '#FDC103',
  },
  PRO: {
    label: 'Protéagineux',
    code: 'PRO',
    picto_light: '/public/cultures-pictos/light/PRO.png',
    picto_dark: '/public/cultures-pictos/dark/PRO.png',
    color: '#F0B401',
  },
  PLA: {
    label: 'Plantes à fibres',
    code: 'PLA',
    picto_light: '/public/cultures-pictos/light/PLA.png',
    picto_dark: '/public/cultures-pictos/dark/PLA.png',
    color: '#BB9200',
  },
  SEM: {
    label: 'Semences',
    code: 'SEM',
    picto_light: '/public/cultures-pictos/light/SEM.png',
    picto_dark: '/public/cultures-pictos/dark/SEM.png',
    color: '#624700',
  },
  RIZ: {
    label: 'Riz',
    code: 'RIZ',
    picto_light: '/public/cultures-pictos/light/RIZ.png',
    picto_dark: '/public/cultures-pictos/dark/RIZ.png',
    color: '#8FB5FE',
  },
  LEG: {
    label: 'Légumineux à grains',
    code: 'LEG',
    picto_light: '/public/cultures-pictos/light/LEG.png',
    picto_dark: '/public/cultures-pictos/dark/LEG.png',
    color: '#FFA07D',
  },
  FOU: {
    label: 'Fourrage',
    code: 'FOU',
    picto_light: '/public/cultures-pictos/light/FOU.png',
    picto_dark: '/public/cultures-pictos/dark/FOU.png',
    color: '#A0C75D',
  },
  PRA: {
    label: 'Prairies permanentes',
    code: 'PRA',
    picto_light: '/public/cultures-pictos/light/PRA.png',
    picto_dark: '/public/cultures-pictos/dark/PRA.png',
    color: '#BFFF60',
  },
  PRT: {
    label: 'Prairies temporaires',
    code: 'PRT',
    picto_light: '/public/cultures-pictos/light/PRT.png',
    picto_dark: '/public/cultures-pictos/dark/PRT.png',
    color: '#E0FFB3',
  },
  VER: {
    label: 'Vergers',
    code: 'VER',
    picto_light: '/public/cultures-pictos/light/VER.png',
    picto_dark: '/public/cultures-pictos/dark/VER.png',
    color: '#FE0100',
  },
  VIN: {
    label: 'Vignes',
    code: 'VIN',
    picto_light: '/public/cultures-pictos/light/VIN.png',
    picto_dark: '/public/cultures-pictos/dark/VIN.png',
    color: '#DF00E4',
  },
  FRU: {
    label: 'Fruits à coque',
    code: 'FRU',
    picto_light: '/public/cultures-pictos/light/FRU.png',
    picto_dark: '/public/cultures-pictos/dark/FRU.png',
    color: '#008001',
  },
  OLI: {
    label: 'Oliviers',
    code: 'OLI',
    picto_light: '/public/cultures-pictos/light/OLI.png',
    picto_dark: '/public/cultures-pictos/dark/OLI.png',
    color: '#9FA600',
  },
  CUL: {
    label: 'Autres cultures industrielles',
    code: 'CUL',
    picto_light: '/public/cultures-pictos/light/CUL.png',
    picto_dark: '/public/cultures-pictos/dark/CUL.png',
    color: '#008081',
  },
  LEGF: {
    label: 'Légumes ou fleurs',
    code: 'LEGF',
    picto_light: '/public/cultures-pictos/light/LEGF.png',
    picto_dark: '/public/cultures-pictos/dark/LEGF.png',
    color: '#FEA1CE',
  },
  CAS: {
    label: 'Canne à sucre',
    code: 'CAS',
    picto_light: '/public/cultures-pictos/light/CAS.png',
    picto_dark: '/public/cultures-pictos/dark/CAS.png',
    color: '#0000FF',
  },
  ARB: {
    label: 'Arboriculture',
    code: 'ARB',
    picto_light: '/public/cultures-pictos/light/ARB.png',
    picto_dark: '/public/cultures-pictos/dark/ARB.png',
    color: '#02B558',
  },
  DIV: {
    label: 'Divers - non disponible',
    code: 'DIV',
    picto_light: '/public/cultures-pictos/light/DIV.png',
    picto_dark: '/public/cultures-pictos/dark/DIV.png',
    color: '#81017F',
  },
}

export function getCulturesGroup({ code }: { code: string }): GroupeCulturauxItem {
  if (!has(GROUPES_CULTURAUX, code)) {
    return GROUPES_CULTURAUX.DIV
  }
  return GROUPES_CULTURAUX[code]
}

export function getContrastedPicto(
  culture: { picto_light: string; picto_dark: string },
  background: string
): string {
  const color = tinycolor(background)
  const isLight = color.isLight()

  return isLight ? culture.picto_light : culture.picto_dark
}
