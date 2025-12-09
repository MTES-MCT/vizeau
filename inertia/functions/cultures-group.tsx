import { has } from 'lodash-es'

export type GroupeCulturauxItem = {
  label: string
  code: string
  picto: string
  color: string
}

export const GROUPES_CULTURAUX: { [key: string]: GroupeCulturauxItem } = {
  BTH: {
    label: 'Blé tendre',
    code: 'BTH',
    picto: '/public/cultures-pictos/BTH.png',
    color: '#FDFF8E',
  },
  MIG: {
    label: 'Maïs grain et ensilage',
    code: 'MIG',
    picto: '/public/cultures-pictos/MIG.png',
    color: '#00FC07',
  },
  ORG: {
    label: 'Orge',
    code: 'ORG',
    picto: '/public/cultures-pictos/ORG.png',
    color: '#F0FF62',
  },
  AUTC: {
    label: 'Autres céréales',
    code: 'AUTC',
    picto: '/public/cultures-pictos/AUTC.png',
    color: '#DAEB02',
  },
  COL: {
    label: 'Colza',
    code: 'COL',
    picto: '/public/cultures-pictos/COL.png',
    color: '#FFECB2',
  },

  TOU: {
    label: 'Tournesol',
    code: 'TOU',
    picto: '/public/cultures-pictos/TOU.png',
    color: '#FFFF00',
  },
  AUL: {
    label: 'Autre oléagineux',
    code: 'AUL',
    picto: '/public/cultures-pictos/AUL.png',
    color: '#FDC103',
  },
  PRO: {
    label: 'Protéagineux',
    code: 'PRO',
    picto: '/public/cultures-pictos/PRO.png',
    color: '#F0B401',
  },
  PLA: {
    label: 'Plantes à fibres',
    code: 'PLA',
    picto: '/public/cultures-pictos/PLA.png',
    color: '#BB9200',
  },
  SEM: {
    label: 'Semences',
    code: 'SEM',
    picto: '/public/cultures-pictos/SEM.png',
    color: '#624700',
  },
  RIZ: {
    label: 'Riz',
    code: 'RIZ',
    picto: '/public/cultures-pictos/RIZ.png',
    color: '#8FB5FE',
  },
  LEG: {
    label: 'Légumineux à grains',
    code: 'LEG',
    picto: '/public/cultures-pictos/LEG.png',
    color: '#FFA07D',
  },
  FOU: {
    label: 'Fourrage',
    code: 'FOU',
    picto: '/public/cultures-pictos/FOU.png',
    color: '#A0C75D',
  },
  PRA: {
    label: 'Prairies permanentes',
    code: 'PRA',
    picto: '/public/cultures-pictos/PRA.png',
    color: '#BFFF60',
  },
  PRT: {
    label: 'Prairies temporaires',
    code: 'PRT',
    picto: '/public/cultures-pictos/PRT.png',
    color: '#E0FFB3',
  },
  VER: {
    label: 'Vergers',
    code: 'VER',
    picto: '/public/cultures-pictos/VER.png',
    color: '#FE0100',
  },
  VIN: {
    label: 'Vignes',
    code: 'VIN',
    picto: '/public/cultures-pictos/VIN.png',
    color: '#DF00E4',
  },
  FRU: {
    label: 'Fruits à coque',
    code: 'FRU',
    picto: '/public/cultures-pictos/FRU.png',
    color: '#008001',
  },
  OLI: {
    label: 'Oliviers',
    code: 'OLI',
    picto: '/public/cultures-pictos/OLI.png',
    color: '#9FA600',
  },
  CUL: {
    label: 'Autres cultures industrielles',
    code: 'CUL',
    picto: '/public/cultures-pictos/CUL.png',
    color: '#008081',
  },
  LEGF: {
    label: 'Légumes ou fleurs',
    code: 'LEGF',
    picto: '/public/cultures-pictos/LEGF.png',
    color: '#FEA1CE',
  },
  CAS: {
    label: 'Canne à sucre',
    code: 'CAS',
    picto: '/public/cultures-pictos/CAS.png',
    color: '#0000FF',
  },
  ARB: {
    label: 'Arboriculture',
    code: 'ARB',
    picto: '/public/cultures-pictos/ARB.png',
    color: '#02B558',
  },
  DIV: {
    label: 'Divers - non disponible',
    code: 'DIV',
    picto: '/public/cultures-pictos/DIV.png',
    color: '#81017F',
  },
}

export function getCulturesGroup({ code }: { code: string }): GroupeCulturauxItem {
  if (!has(GROUPES_CULTURAUX, code)) {
    return GROUPES_CULTURAUX.DIV
  }
  return GROUPES_CULTURAUX[code]
}
