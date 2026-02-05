import { LogEntryJson } from '../../types/models'
import { truncateStr } from '~/functions/string'
import { AdditionalInfosProps } from '~/ui/ListItem'
import { DateTime } from 'luxon'

const MAX_TITLE_LENGTH = 90

export function getLogEntryTitle(logEntry: LogEntryJson, titleLength = MAX_TITLE_LENGTH): string {
  if (logEntry.title) {
    return truncateStr(logEntry.title, titleLength)
  }
  if (logEntry.notes) {
    return truncateStr(logEntry.notes, titleLength)
  }
  if (logEntry.date) {
    return new Date(logEntry.date).toLocaleDateString()
  }

  return new Date(logEntry.createdAt).toLocaleDateString()
}

export function getLogEntryDateDiffObject(logEntry: LogEntryJson): AdditionalInfosProps['alert'] {
  if (!logEntry.date) {
    return {}
  }

  if (logEntry.isCompleted) {
    return {
      severity: 'infos',
      text: 'Tâche effectuée',
    }
  }

  const date = DateTime.fromISO(logEntry.date)
  const now = DateTime.now()

  if (date >= now && date <= now.plus({ days: 7 })) {
    const diffInDays = Math.ceil(date.diffNow('days').days)
    return {
      severity: 'warning',
      text: diffInDays === 1 ? 'Demain' : `Dans ${diffInDays} jours`,
    }
  }

  if (date < now && !logEntry.isCompleted) {
    // It's a past date so we need to inverse the diff to get positive days
    const diffInDays = Math.ceil(-date.diffNow('days').days)
    return {
      severity: 'error',
      text: `Retard de ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`,
    }
  }

  return {}
}

export function getLogEntryAdditionalInfos(logEntry: LogEntryJson): AdditionalInfosProps {
  const additionalInfos: AdditionalInfosProps = {}

  if (logEntry.date) {
    const date = DateTime.fromISO(logEntry.date)

    additionalInfos.iconId = 'fr-icon-time-line'
    additionalInfos.message = `Tâche planifiée pour le ${date.toLocaleString(
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      },
      { locale: 'fr-FR' }
    )}`

    additionalInfos.alert = getLogEntryDateDiffObject(logEntry)
  }

  return additionalInfos
}
