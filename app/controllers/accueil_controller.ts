import type { HttpContext } from '@adonisjs/core/http'
import type { Logger } from '@adonisjs/core/logger'
import { inject } from '@adonisjs/core'
import { LogEntryService } from '#services/log_entry_service'
import { ProjectService } from '#services/project_service'
import { ProjectStepService } from '#services/project_step_service'
import { TerritoireService } from '#services/territoire_service'
import { AacService } from '#services/aac_service'
import { EventLoggerService } from '#services/event_logger_service'
import { TerritoireDto } from '../dto/territoire_dto.js'
import { ProchainesTacheDto } from '../dto/prochaines_tache_dto.js'
import { ProjectDto } from '../dto/project_dto.js'
import type { ConformiteRepartitionJson } from '#types/captage'
import type { ProchainesTacheJson } from '#types/models'

// Définition centralisée des noms d'événements pour ce contrôleur
const EVENTS = {
  PAGE_VIEW: { name: 'accueil_page_viewed' },
}

/**
 * Les widgets alimentés par le jeu de données AAC (DuckDB sur S3) sont accessoires :
 * si la source distante est indisponible ou trop lente, on dégrade le widget concerné
 * plutôt que de renvoyer une 500 sur toute la page d'accueil.
 */
async function withAacFallback<T>(
  logger: Logger,
  label: string,
  query: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await query()
  } catch (error) {
    logger.error({ err: error }, `Données AAC indisponibles (${label})`)
    return fallback
  }
}

@inject()
export default class AccueilController {
  constructor(
    public logEntryService: LogEntryService,
    public projectService: ProjectService,
    public projectStepService: ProjectStepService,
    public territoireService: TerritoireService,
    public aacService: AacService,
    public eventLogger: EventLoggerService
  ) {}
  async publicIndex({ inertia, auth, response }: HttpContext) {
    const isAuthenticated = await auth.check()

    if (isAuthenticated) {
      return response.redirect().toRoute('accueil')
    }

    return inertia.render('bienvenue', {})
  }

  async index({ inertia, auth, logger }: HttpContext) {
    const user = auth.getUserOrFail()

    this.eventLogger.logEvent({ userId: user.id, ...EVENTS.PAGE_VIEW })

    const territoireModels = await this.territoireService.getAllTerritoiresForUser(user.id)

    const territoiresAvecCode = territoireModels.filter(
      (territoire): territoire is typeof territoire & { code: string } => territoire.code !== null
    )
    const aacCodes = territoiresAvecCode.map((territoire) => territoire.code)

    const [
      urgentLogEntriesCount,
      urgentProjectStepsCount,
      currentProjects,
      aacSummariesByCode,
      conformiteStatsByAacCode,
      substancesRepartition,
      captagesAlertes,
      upcomingProjectSteps,
      upcomingLogEntries,
    ] = await Promise.all([
      this.logEntryService.countUrgentLogEntriesForUser(user.id),
      this.projectStepService.countUrgentStepsForUser(user.id),
      this.projectService.getCurrentProjects(user.id),
      withAacFallback(
        logger,
        'résumés AAC',
        () => this.aacService.getSummariesByCode(aacCodes),
        {}
      ),
      withAacFallback(
        logger,
        'stats de conformité',
        () => this.aacService.getConformiteStatsByAacCodes(aacCodes),
        new Map()
      ),
      withAacFallback(
        logger,
        'substances à risque',
        () => this.aacService.getSubstancesAlertesRepartition(territoiresAvecCode),
        { tousTerritoires: [], parTerritoire: {} }
      ),
      withAacFallback(
        logger,
        'points de prélèvement à risque',
        () => this.aacService.getCaptagesAlertesByAacCodes(aacCodes),
        []
      ),
      this.projectStepService.getUpcomingStepsForUser(user.id),
      this.logEntryService.getUpcomingLogEntriesForUser(user.id),
    ])

    const prochainesTaches: ProchainesTacheJson[] = [
      ...upcomingProjectSteps.map((step) => ProchainesTacheDto.fromProjectStep(step)),
      ...upcomingLogEntries.map((logEntry) => ProchainesTacheDto.fromLogEntry(logEntry)),
    ].sort((a, b) => a.date.localeCompare(b.date))

    const territoires = territoireModels.map((territoire) =>
      TerritoireDto.fromModel(
        territoire,
        territoire.code ? aacSummariesByCode[territoire.code] : null
      )
    )

    const conformiteRepartition: ConformiteRepartitionJson = {
      parTerritoire: Object.fromEntries(
        territoiresAvecCode
          .filter((territoire) => conformiteStatsByAacCode.has(territoire.code))
          .map((territoire) => [territoire.id, conformiteStatsByAacCode.get(territoire.code)!])
      ),
    }

    return inertia.render('accueil', {
      urgentTasksCount: urgentLogEntriesCount + urgentProjectStepsCount,
      currentProjects: ProjectDto.toJsonArray(currentProjects),
      territoires,
      conformiteRepartition,
      substancesRepartition,
      captagesAlertes,
      prochainesTaches,
    })
  }

  async noTerritoire({ inertia, response, auth }: HttpContext) {
    const user = auth.getUserOrFail()

    await user.loadOnce('territoires')

    if (user.territoires.length > 0) {
      return response.redirect('/')
    }

    return inertia.render('no_territoire', {})
  }
}
