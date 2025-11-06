import type { HttpContext } from '@adonisjs/core/http'
import { errors } from '@adonisjs/auth'
import User from '#models/user'

const redirectAfterLogin = '/accueil'

export default class SessionController {
  async index({ inertia, auth, response }: HttpContext) {
    // Try to authenticate via an existing session.
    try {
      await auth.use('web').authenticate()
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
    await auth.use('web').login(user, !!request.input('remember_me'))

    response.redirect(redirectAfterLogin)
  }

  async delete({ auth, response }: HttpContext) {
    await auth.use('web').logout()
    return response.redirect('/')
  }
}
