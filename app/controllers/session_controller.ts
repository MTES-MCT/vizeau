import type { HttpContext } from '@adonisjs/core/http'
import { errors } from '@adonisjs/auth'
import User from '#models/user'
import { EventLoggerService } from '#services/event_logger_service'
import { inject } from '@adonisjs/core'

const redirectAfterLogin = '/accueil'

@inject()
export default class SessionController {
  constructor(public eventLogger: EventLoggerService) {}

  async index({ inertia, auth, response }: HttpContext) {
    // Try to authenticate via an existing session.
    try {
      const user = await auth.use('web').authenticate()

      this.eventLogger.logEvent({ userId: user.id, name: 'session_log_back' })

      return response.redirect(redirectAfterLogin)
    } catch (error) {
      // If authentication fails, just render the login view
      if (error.code === errors.E_UNAUTHORIZED_ACCESS.code) {
        return inertia.render('login')
      }

      // Other errors must be thrown
      throw error
    }
  }

  async store({ auth, request, response }: HttpContext) {
    const { email, password } = request.only(['email', 'password'])

    const user = await User.verifyCredentials(email.toLowerCase(), password)
    this.eventLogger.logEvent({ userId: user.id, name: 'session_login' })
    await auth.use('web').login(user, !!request.input('remember_me'))

    response.redirect(redirectAfterLogin)
  }

  async delete({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    this.eventLogger.logEvent({ userId: user.id, name: 'session_logout' })
    await auth.use('web').logout()
    return response.redirect('/')
  }
}
