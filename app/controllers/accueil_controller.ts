import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { ExploitationService } from '#services/exploitation_service'
import { LogEntryService } from '#services/log_entry_service'

@inject()
export default class AccueilController {
  constructor(
    public exploitationService: ExploitationService,
    public logEntryService: LogEntryService
  ) {}
  async index({ inertia, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const latestExploitations = await this.exploitationService.queryLatestExploitations()
    const latestLogEntries = await this.logEntryService.getLatestLogEntriesFromUser(user.id)
    const latestLogEntriesWithExploitationNames = await Promise.all(
      latestLogEntries.map(async (logEntry) => {
        const exploitationName = await this.exploitationService.getExploitationName(
          logEntry.exploitationId
        )
        return {
          ...logEntry.toJSON(),
          exploitationName,
        }
      })
    )

    return inertia.render('accueil', {
      latestExploitations,
      latestLogEntries: latestLogEntriesWithExploitationNames,
    })
  }
}
