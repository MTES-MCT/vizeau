import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { createLogEntryValidator } from '#validators/log_entry'
import { LogEntryService } from '#services/log_entry_service'
import { createErrorFlashMessage, createSuccessFlashMessage } from '../helpers/flash_message.js'

@inject()
export default class LogEntriesController {
  constructor(public logEntryService: LogEntryService) {}

  public async create({ auth, request, response, session, logger }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(createLogEntryValidator)

    try {
      await this.logEntryService.createLogEntry({
        userId: user.id,
        exploitationId: payload.params.exploitationId,
        notes: payload.notes,
        tags: payload.tags,
      })
      createSuccessFlashMessage(session, "L'entrée de journal a été créée avec succès.")
    } catch (error) {
      logger.error('Error creating log entry:', error)
      createErrorFlashMessage(
        session,
        "Une erreur est survenue lors de la création de l'entrée de journal."
      )
    }

    return response.redirect().toRoute('exploitations.get', [payload.params.exploitationId])
  }
}
