import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { ExploitationDto } from '../dto/exploitation_dto.js'
import { ExploitationService } from '#services/exploitation_service'
import env from '#start/env'
import { EventLoggerService } from '#services/event_logger_service'

@inject()
export default class VisualisationController {
  constructor(
    public exploitationService: ExploitationService,
    public eventLogger: EventLoggerService
  ) {}

  async index({ request, inertia, auth }: HttpContext) {
    const user = auth.getUserOrFail()

    this.eventLogger.logEvent({
      userId: user.id,
      name: 'visualisation_page_viewed',
      context: request.all(),
    })

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
