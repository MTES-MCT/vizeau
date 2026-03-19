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
import { AacService } from '#services/aac_service'
import { AacDto } from '../dto/aac_dto.js'

// Définition centralisée des noms d'événements pour ce contrôleur
const EVENTS = {
  PAGE_VIEW: { name: 'visualisation_page_viewed' },
}

const AAC_PER_PAGE = 20

@inject()
export default class VisualisationController {
  constructor(
    public exploitationService: ExploitationService,
    public parcelleService: ParcelleService,
    public eventLogger: EventLoggerService,
    public aacService: AacService
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

    const aacPage = Math.max(1, Number.parseInt(request.input('aacPage', '1'), 10) || 1)
    const aacRecherche = request.input('aacRecherche') || undefined
    const aacCommune = request.input('aacCommune') || undefined

    const { data: aacData, total: aacTotal } = await this.aacService.getAll(
      aacPage,
      AAC_PER_PAGE,
      aacRecherche,
      aacCommune
    )
    const aacLastPage = Math.max(1, Math.ceil(aacTotal / AAC_PER_PAGE))

    return inertia.render('visualisation', {
      aacs: aacData.map(AacDto.fromRawSummary),
      aacMeta: {
        total: aacTotal,
        perPage: AAC_PER_PAGE,
        currentPage: aacPage,
        lastPage: aacLastPage,
      },
      aacQueryString: {
        aacRecherche: aacRecherche ?? '',
        aacCommune: aacCommune ?? '',
        aacPage: String(aacPage),
      },
      filteredExploitations: async () => {
        const results = await this.exploitationService
          .getAllActiveExploitationsByNameOrContactName(request.input('recherche'), user.id)
          .preload('parcelles', (parcelleQuery) => {
            parcelleQuery.where('year', request.qs().millesime).orderBy('rpgId', 'asc')
          })

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
    const { exploitationId, year, parcelles } = await request.validateUsing(
      assignParcellesToExploitationValidator
    )

    try {
      await this.parcelleService.syncParcellesForExploitation(exploitationId, year, parcelles)
    } catch (error) {
      logger.warn(error)
      createErrorFlashMessage(session, error)
    }

    // We forward the query string parameters to preserve the millesime parameter
    return response.redirect().withQs().back()
  }
}
