import type { HttpContext } from '@adonisjs/core/http'
import { createRequire } from 'node:module'
import type { ProjetJson } from '../../types/models.js'

const require = createRequire(import.meta.url)
const projetsMock = require('../../database/data/projets_mock.json') as ProjetJson[]

export default class ProjetsController {
  async index({ inertia, request }: HttpContext) {
    const recherche = request.input('recherche', '')
    const projets = recherche
      ? projetsMock.filter(
          (p) =>
            p.nom.toLowerCase().includes(recherche.toLowerCase()) ||
            p.type_action.toLowerCase().includes(recherche.toLowerCase())
        )
      : projetsMock

    return inertia.render('projets/index', {
      projets,
      projetsCount: projetsMock.length,
      queryString: { recherche },
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
