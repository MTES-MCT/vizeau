import { LogEntryJson } from '../../types/models'
import { truncateStr } from '~/functions/string'

const MAX_TITLE_LENGTH = 90

export function getLogEntryTitle(logEntry: LogEntryJson, titleLength = MAX_TITLE_LENGTH): string {
  if (logEntry.title) {
    return truncateStr(logEntry.title, titleLength)
  }
  if (logEntry.notes) {
    return truncateStr(logEntry.notes, titleLength)
  }
  if (logEntry.createdAt) {
    return new Date(logEntry.createdAt).toLocaleDateString()
  }

  // A log entry should always have at least one of these fields, but in case none are present:
  return ''
}
