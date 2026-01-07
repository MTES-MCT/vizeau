import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import {
  createLogEntryValidator,
  destroyLogEntryValidator,
  updateLogEntryValidator,
} from '#validators/log_entry'
import { LogEntryService } from '#services/log_entry_service'
import { createErrorFlashMessage, createSuccessFlashMessage } from '../helpers/flash_message.js'
import { LogEntryTagService } from '#services/log_entry_tag_service'
import { createLogEntryTagValidator, deleteLogEntryTagValidator } from '#validators/log_entry_tag'
import { errors } from '@adonisjs/auth'
import { EventLoggerService } from '#services/event_logger_service'

@inject()
export default class LogEntriesController {
  constructor(
    public logEntryService: LogEntryService,
    public logEntryTagService: LogEntryTagService,
    public eventLogger: EventLoggerService
  ) {}

  async create({ auth, request, response, session, logger }: HttpContext) {
    const user = auth.getUserOrFail()
    this.eventLogger.logEvent({
      userId: user.id,
      name: 'log_entries_create',
      step: 'submitted',
      context: { payload: request.all() },
    })

    const payload = await request.validateUsing(createLogEntryValidator)

    try {
      await this.logEntryService.createLogEntry({
        userId: user.id,
        exploitationId: payload.params.exploitationId,
        notes: payload.notes,
        tags: payload.tags,
      })

      this.eventLogger.logEvent({
        userId: user.id,
        name: 'log_entries_create',
        step: 'created',
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

  async edit({ auth, request, response, session, logger }: HttpContext) {
    const user = auth.getUserOrFail()
    this.eventLogger.logEvent({
      userId: user.id,
      name: 'log_entries_update',
      step: 'submitted',
      context: { payload: request.all() },
    })
    const { id, params, ...payload } = await request.validateUsing(updateLogEntryValidator)

    try {
      await this.logEntryService.updateLogEntry(id, user.id, params.exploitationId, {
        notes: payload.notes,
        tags: payload.tags,
      })

      this.eventLogger.logEvent({
        userId: user.id,
        name: 'log_entries_update',
        step: 'updated',
      })

      createSuccessFlashMessage(session, "L'entrée de journal a été mise à jour avec succès.")
    } catch (error) {
      logger.error('Error updating log entry:', error)
      if (error.code === errors.E_UNAUTHORIZED_ACCESS.code) {
        createErrorFlashMessage(session, 'Vous ne pouvez éditer que vos entrées de journal.')
      } else {
        createErrorFlashMessage(
          session,
          "Une erreur est survenue lors de la mise à jour de l'entrée de journal."
        )
      }
    }

    return response.redirect().toRoute('exploitations.get', [params.exploitationId])
  }

  async destroy({ auth, request, response, session, logger }: HttpContext) {
    const user = auth.getUserOrFail()
    this.eventLogger.logEvent({
      userId: user.id,
      name: 'log_entries_deleted',
      context: { payload: request.all() },
    })
    const { id, params } = await request.validateUsing(destroyLogEntryValidator)

    try {
      await this.logEntryService.deleteLogEntry(id, user.id, params.exploitationId)
      createSuccessFlashMessage(session, "L'entrée de journal a été supprimée avec succès.")
    } catch (error) {
      logger.error('Error deleting log entry:', error)
      if (error.code === errors.E_UNAUTHORIZED_ACCESS.code) {
        createErrorFlashMessage(session, 'Vous ne pouvez supprimer que vos entrées de journal.')
      } else {
        createErrorFlashMessage(
          session,
          "Une erreur est survenue lors de la suppression de l'entrée de journal."
        )
      }
    }

    return response.redirect().toRoute('exploitations.get', [params.exploitationId])
  }

  async createTagForExploitation({ auth, request, response, session, logger }: HttpContext) {
    const user = auth.getUserOrFail()
    this.eventLogger.logEvent({
      userId: user.id,
      name: 'log_entry_tag_create',
      step: 'submitted',
      context: { payload: request.all() },
    })
    const payload = await request.validateUsing(createLogEntryTagValidator)

    try {
      await this.logEntryTagService.createTagForExploitation(
        payload.params.exploitationId,
        user.id,
        payload.name
      )

      this.eventLogger.logEvent({
        userId: user.id,
        name: 'log_entry_tag_create',
        step: 'created',
      })
    } catch (error) {
      logger.error('Error creating tag for exploitation:', error)
      createErrorFlashMessage(
        session,
        "Une erreur est survenue lors de la création de l'étiquette."
      )
    }
    return response.redirect().back()
  }

  async destroyTagForExploitation({ auth, request, response, session, logger }: HttpContext) {
    const user = auth.getUserOrFail()
    this.eventLogger.logEvent({
      userId: user.id,
      name: 'log_entry_tag_deleted',
    })
    const payload = await request.validateUsing(deleteLogEntryTagValidator)

    try {
      await this.logEntryTagService.deleteTag(payload.tagId, payload.params.exploitationId, user.id)
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
