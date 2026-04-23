import type { HttpContext } from '@adonisjs/core/http'
import { createRequire } from 'node:module'
import type { ProjetJson } from '../../types/models.js'

const require = createRequire(import.meta.url)
const projetsMock = require('../../database/data/projets_mock.json') as ProjetJson[]

export default class ProjetsController {
  async index({ inertia }: HttpContext) {
    return inertia.render('projets/index', {
      projets: projetsMock,
      projetsCount: projetsMock.length,
    })
  }

  async get({ params, inertia, response }: HttpContext) {
    const projet = projetsMock.find((p) => p.id === params.id)
    if (!projet) {
      return response.notFound({ message: 'Projet introuvable' })
    }
    return inertia.render('projets/id', { projet })
  }
}
