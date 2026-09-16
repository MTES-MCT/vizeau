import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { LogEntryService } from '#services/log_entry_service'
import { ProjectService } from '#services/project_service'
import { ProjectStepService } from '#services/project_step_service'
import { EventLoggerService } from '#services/event_logger_service'
import { ProjectDto } from '../dto/project_dto.js'

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

    const [urgentLogEntriesCount, urgentProjectStepsCount, currentProjects] = await Promise.all([
      this.logEntryService.countUrgentLogEntriesForUser(user.id),
      this.projectStepService.countUrgentStepsForUser(user.id),
      this.projectService.getCurrentProjects(user.id),
    ])

    return inertia.render('accueil', {
      urgentTasksCount: urgentLogEntriesCount + urgentProjectStepsCount,
      currentProjects: ProjectDto.toJsonArray(currentProjects),
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
