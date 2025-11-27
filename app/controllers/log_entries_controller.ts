import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { createLogEntryValidator } from '#validators/log_entry'
import { LogEntryService } from '#services/log_entry_service'
import { createErrorFlashMessage, createSuccessFlashMessage } from '../helpers/flash_message.js'
import { LogEntryTagService } from '#services/log_entry_tag_service'
import { createLogEntryTagValidator, deleteLogEntryTagValidator } from '#validators/log_entry_tag'

@inject()
export default class LogEntriesController {
  constructor(
    public logEntryService: LogEntryService,
    public logEntryTagService: LogEntryTagService
  ) {}

  async create({ auth, request, response, session, logger }: HttpContext) {
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

  async createTagForExploitation({ auth, request, response, session, logger }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(createLogEntryTagValidator)

    try {
      await this.logEntryTagService.createTagForExploitation(
        payload.params.exploitationId,
        user.id,
        payload.name
      )
    } catch (error) {
      logger.error('Error creating tag for exploitation:', error)
      createErrorFlashMessage(
        session,
        "Une erreur est survenue lors de la création de l'étiquette."
      )
    }
    return response.redirect().back()
  }

  async destroy({ request, response, session, logger }: HttpContext) {
    const payload = await request.validateUsing(deleteLogEntryTagValidator)

    try {
      await this.logEntryTagService.deleteTag(payload.tagId, payload.params.exploitationId)
    } catch (error) {
      logger.error('Error deleting tag:', error)
      createErrorFlashMessage(
        session,
        "Une erreur est survenue lors de la suppression de l'étiquette."
      )
    }
    return response.redirect().back()
  }
}
