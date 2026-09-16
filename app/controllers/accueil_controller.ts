import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { LogEntryService } from '#services/log_entry_service'
import { ProjectService } from '#services/project_service'
import { ProjectStepService } from '#services/project_step_service'
import { TerritoireService } from '#services/territoire_service'
import { AacService } from '#services/aac_service'
import { EventLoggerService } from '#services/event_logger_service'
import { TerritoireDto } from '../dto/territoire_dto.js'
import { ProjectDto } from '../dto/project_dto.js'
import type { ConformiteRepartitionJson } from '#types/captage'

// Définition centralisée des noms d'événements pour ce contrôleur
const EVENTS = {
  PAGE_VIEW: { name: 'accueil_page_viewed' },
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

  async index({ inertia, auth }: HttpContext) {
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
    ] = await Promise.all([
      this.logEntryService.countUrgentLogEntriesForUser(user.id),
      this.projectStepService.countUrgentStepsForUser(user.id),
      this.projectService.getCurrentProjects(user.id),
      this.aacService.getSummariesByCode(aacCodes),
      this.aacService.getConformiteStatsByAacCodes(aacCodes),
    ])

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
