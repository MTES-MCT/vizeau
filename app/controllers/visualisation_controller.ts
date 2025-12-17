import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { ExploitationDto } from '../dto/exploitation_dto.js'
import { ExploitationService } from '#services/exploitation_service'
import env from '#start/env'

@inject()
export default class VisualisationController {
  constructor(public exploitationService: ExploitationService) {}

  async index({ request, inertia, auth }: HttpContext) {
    const user = auth.getUserOrFail()

    return inertia.render('visualisation', {
      exploitations: async () => {
        const results = await this.exploitationService.getAllActiveExploitationsByNameOrContactName(
          request.input('recherche')
        )

        return ExploitationDto.toJsonArray(results)
      },
      user,
      queryString: request.qs(),
      pmtilesUrl: env.get('PMTILES_URL'),
    })
  }
}
