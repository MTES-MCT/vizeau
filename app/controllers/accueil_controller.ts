import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { ExploitationService } from '#services/exploitation_service'
import { LogEntryService } from '#services/log_entry_service'
import { EventLoggerService } from '#services/event_logger_service'
import router from '@adonisjs/core/services/router'

// Définition centralisée des noms d'événements pour ce contrôleur
const EVENTS = {
  PAGE_VIEW: { name: 'accueil_page_viewed' },
}

@inject()
export default class AccueilController {
  constructor(
    public exploitationService: ExploitationService,
    public logEntryService: LogEntryService,
    public eventLogger: EventLoggerService
  ) {}
  async index({ inertia, auth }: HttpContext) {
    const user = auth.getUserOrFail()

    this.eventLogger.logEvent({ userId: user.id, ...EVENTS.PAGE_VIEW })

    const latestExploitations = await this.exploitationService.queryLatestExploitations(user.id)
    const latestLogEntries = await this.logEntryService.getLatestLogEntriesFromUser(user.id)

    return inertia.render('accueil', {
      latestExploitations,
      latestLogEntries,
      createExploitationUrl: router.builder().make('exploitations.create'),
    })
  }
}
