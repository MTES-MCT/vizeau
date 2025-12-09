import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { ExploitationDto } from '../dto/exploitation_dto.js'
import { ExploitationService } from '#services/exploitation_service'

@inject()
export default class VisaualisationController {
  constructor(public exploitationService: ExploitationService) {}

  async index({ request, inertia, auth }: HttpContext) {
    const user = auth.getUserOrFail()

    return inertia.render('visualisation', {
      exploitationsWithPagination: async () => {
        const results = await this.exploitationService.searchActiveExploitationsByNameOrContactName(
          request.input('recherche')
        )

        return new ExploitationDto(results).toJson()
      },
      user,
      queryString: request.qs(),
    })
  }
}
