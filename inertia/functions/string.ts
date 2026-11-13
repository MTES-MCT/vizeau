import { truncate } from 'lodash-es'

export const truncateStr = (str: string, length: number): string => {
  if (str.length <= length) {
    return str
  }
  return truncate(str, { length })
}

/** « 1 parcelle », « 3 parcelles » : le nombre suivi de la forme accordée. */
export const pluralize = (count: number, singular: string, plural: string): string =>
  `${count} ${count > 1 ? plural : singular}`
