import { LogEntryJson } from '../../types/models'

import { AdditionalInfosProps } from '~/ui/ListItem'
import { DateTime } from 'luxon'
import { fr } from '@codegouvfr/react-dsfr'

export const severityColorMap: Record<
  NonNullable<NonNullable<AdditionalInfosProps['alert']>['severity']>,
  string
> = {
  // Infos: Marianne blue color, upcoming tasks or tasks without date
  infos: fr.colors.decisions.text.title.blueFrance.default,
  // Warning: orange color, upcoming tasks within a week or tasks that are due today
  warning: fr.colors.decisions.text.default.warning.default,
  // Error: red color, late tasks
  error: fr.colors.decisions.text.default.error.default,
  // Success: neutral color, completed tasks
  success: fr.colors.decisions.text.default.info.default,
}

export function getLogEntryTitle(logEntry: LogEntryJson): string {
  if (logEntry.title) {
    return logEntry.title
  }
  if (logEntry.notes) {
    return logEntry.notes
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

  // Task is completed
  if (logEntry.isCompleted) {
    return {
      severity: 'success',
      text: 'Tâche effectuée',
    }
  }

  const date = DateTime.fromISO(logEntry.date, { zone: 'utc' }).startOf('day')
  const now = DateTime.now().setZone('utc').startOf('day')

  const diffInDays = date.diff(now, 'days').days

  // Task is late
  if (diffInDays < 0) {
    // It's a past date so we need to inverse the diff to get positive days
    const displayableDiffInDays = Math.abs(Math.ceil(diffInDays))
    return {
      severity: 'error',
      text: `Retard de ${displayableDiffInDays} jour${displayableDiffInDays > 1 ? 's' : ''}`,
    }
  }

  // Task is upcoming within a week
  if (diffInDays >= 0 && diffInDays <= 7) {
    let text: string

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

  // Task is upcoming but not within a week
  return {
    severity: 'infos',
    text: `Dans ${Math.ceil(diffInDays)} jours`,
  }
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
