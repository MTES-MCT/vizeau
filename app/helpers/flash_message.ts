import { Session } from '@adonisjs/session'

export function createSuccessFlashMessage(session: Session, message: string, description?: string) {
  session.flash('success', { message, description })
}

export function createErrorFlashMessage(session: Session, message: string, description?: string) {
  session.flash('error', { message, description })
}

export function createWarningFlashMessage(session: Session, message: string, description?: string) {
  session.flash('warning', { message, description })
}

export function createInfoFlashMessage(session: Session, message: string, description?: string) {
  session.flash('info', { message, description })
}
