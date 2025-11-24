import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { createLogEntryValidator } from '#validators/log_entry'
import { LogEntryService } from '#services/log_entry_service'

@inject()
export default class LogEntriesController {
  constructor(public logEntryService: LogEntryService) {}

  public async create({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(createLogEntryValidator)
    await this.logEntryService.createLogEntry({
      userId: user.id,
      exploitationId: payload.params.exploitationId,
      notes: payload.notes,
      tags: payload.tags,
    })

    return response.redirect().toRoute('exploitations.get', [payload.params.exploitationId])
  }
}
