import { DateTime } from 'luxon'
import { ProjectStepJson } from '../../types/models'
import { AdditionalInfosProps } from '~/ui/ListItem'
import { severityColorMap } from '~/functions/log_entries'

export { severityColorMap }

export function getProjectStepTitle(step: ProjectStepJson): string {
  if (step.title) {
    return step.title
  }
  if (step.note) {
    return step.note
  }
  if (step.date) {
    return new Date(step.date).toLocaleDateString()
  }

  return new Date(step.createdAt).toLocaleDateString()
}

export function getProjectStepDateDiffObject(step: ProjectStepJson): AdditionalInfosProps['alert'] {
  if (!step.date) {
    return {}
  }

  if (step.isValidated) {
    return {
      severity: 'success',
      text: 'Tâche effectuée',
    }
  }

  const date = DateTime.fromISO(step.date, { zone: 'utc' }).startOf('day')
  const now = DateTime.now().setZone('utc').startOf('day')
  const diffInDays = date.diff(now, 'days').days

  if (diffInDays < 0) {
    const displayableDiffInDays = Math.abs(Math.ceil(diffInDays))
    return {
      severity: 'error',
      text: `Retard de ${displayableDiffInDays} jour${displayableDiffInDays > 1 ? 's' : ''}`,
    }
  }

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

  return {
    severity: 'infos',
    text: `Dans ${Math.ceil(diffInDays)} jours`,
  }
}

export function getProjectStepAdditionalInfos(step: ProjectStepJson): AdditionalInfosProps {
  const additionalInfos: AdditionalInfosProps = {}

  if (step.date) {
    const date = DateTime.fromISO(step.date)

    additionalInfos.iconId = 'fr-icon-time-line'
    additionalInfos.message = `Tâche planifiée pour le ${date.toLocaleString(
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      },
      { locale: 'fr-FR' }
    )}`

    additionalInfos.alert = getProjectStepDateDiffObject(step)
  }

  return additionalInfos
}
