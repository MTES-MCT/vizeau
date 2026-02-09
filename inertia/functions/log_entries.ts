import { LogEntryJson } from '../../types/models'

import { truncateStr } from '~/functions/string'

export function getLogEntryTitle(logEntry: LogEntryJson, titleLength?: number): string {
  if (logEntry.title) {
    return titleLength ? truncateStr(logEntry.title, titleLength) : logEntry.title
  }
  if (logEntry.notes) {
    return titleLength ? truncateStr(logEntry.notes, titleLength) : logEntry.notes
  }
  if (logEntry.createdAt) {
    return new Date(logEntry.createdAt).toLocaleDateString()
  }
  // A log entry should always have at least one of these fields, but in case none are present:
  return ''
}
