import type { HttpContext } from '@adonisjs/core/http'

export default class AccueilController {
  async index({ inertia }: HttpContext) {
    return inertia.render('accueil')
  }
}
