import { Session } from '@adonisjs/session'

export function createSuccessFlashMessage(
  session: Session,
  message: string,
  description?: string,
  context?: string
) {
  session.flash('success', { message, description, context })
}

export function createErrorFlashMessage(
  session: Session,
  message: string,
  description?: string,
  context?: string
) {
  session.flash('error', { message, description, context })
}

export function createWarningFlashMessage(
  session: Session,
  message: string,
  description?: string,
  context?: string
) {
  session.flash('warning', { message, description, context })
}

export function createInfoFlashMessage(
  session: Session,
  message: string,
  description?: string,
  context?: string
) {
  session.flash('info', { message, description, context })
}
