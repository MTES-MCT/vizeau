import { truncate } from 'lodash-es'

export const truncateStr = (str: string, length: number): string => {
  if (str.length <= length) {
    return str
  }
  return truncate(str, { length: length, separator: '...' })
}
