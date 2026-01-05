import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { ExploitationDto } from '../dto/exploitation_dto.js'
import { ExploitationService } from '#services/exploitation_service'
import env from '#start/env'
import { EventLoggerService } from '#services/event_logger_service'
import { assignParcellesToExploitationValidator } from '#validators/parcelle'
import { ParcelleService } from '#services/parcelle_service'
import { createErrorFlashMessage } from '../helpers/flash_message.js'
import router from '@adonisjs/core/services/router'

// TODO: Dynamically get the current millesime
const currentMillesime = 2024

// Définition centralisée des noms d'événements pour ce contrôleur
const EVENTS = {
  PAGE_VIEW: { name: 'visualisation_page_viewed' },
}


@inject()
export default class VisualisationController {
  constructor(
    public exploitationService: ExploitationService,
    public parcelleService: ParcelleService,
    public eventLogger: EventLoggerService
  ) {}

  async index({ request, response, inertia, auth }: HttpContext) {
    // Ensure millesime is present in query string
    if (!request.qs().millesime) {
      return response.redirect().withQs('millesime', '2024').toPath(request.url())
    }

    const user = auth.getUserOrFail()

    this.eventLogger.logEvent({
      userId: user.id,
      ...EVENTS.PAGE_VIEW,
      context: request.all(),
    })

    return inertia.render('visualisation', {
      filteredExploitations: async () => {
        const results = await this.exploitationService
          .getAllActiveExploitationsByNameOrContactName(request.input('recherche'))
          .preload('parcelles')

        return ExploitationDto.toJsonArray(results)
      },
      // Get the IDs of parcelles that are already assigned to other exploitations for the given year
      unavailableParcellesIds: inertia.optional(async () => {
        if (!request.qs().exploitationId) {
          return []
        }

        return this.parcelleService.getParcellesRpgIdsForOtherExploitations(
          request.qs().millesime,
          request.qs().exploitationId
        )
      }),
      user,
      queryString: request.qs(),
      pmtilesUrl: env.get('PMTILES_URL', ''),
      assignParcellesToExploitationUrl: router
        .builder()
        .make('visualisation.assignParcellesToExploitation'),
    })
  }

  async assignParcellesToExploitation({ request, response, session, logger }: HttpContext) {
    const { exploitationId, parcelles } = await request.validateUsing(
      assignParcellesToExploitationValidator
    )

    try {
      await this.parcelleService.syncParcellesForExploitation(
        exploitationId,
        currentMillesime,
        parcelles
      )
    } catch (error) {
      logger.warn(error)
      createErrorFlashMessage(session, error)
    }

    return response.redirect().back()
  }
}
