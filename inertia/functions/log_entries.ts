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

  const date = DateTime.fromISO(logEntry.date, { zone: 'utc' }).startOf('day')
  const now = DateTime.now().setZone('utc').startOf('day')

  const diffInDays = date.diff(now, 'days').days

  if (diffInDays >= 0 && diffInDays <= 7) {
    let text = ''

    if (diffInDays === 0) {
      text = "Aujourd'hui"
    } else if (diffInDays === 1) {
      text = 'Demain'
    } else {
      text = `Dans ${Math.ceil(diffInDays)} jours`
    }

    return {
      severity: 'warning',
      text,
    }
  }

  if (diffInDays < 0 && !logEntry.isCompleted) {
    // It's a past date so we need to inverse the diff to get positive days
    const displayableDiffInDays = Math.abs(Math.ceil(diffInDays))
    return {
      severity: 'error',
      text: `Retard de ${displayableDiffInDays} jour${displayableDiffInDays > 1 ? 's' : ''}`,
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
