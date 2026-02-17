import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import {
  completeLogEntryValidator,
  createLogEntryValidator,
  destroyLogEntryValidator,
  downloadDocumentValidator,
  updateLogEntryValidator,
} from '#validators/log_entry'
import { LogEntryService } from '#services/log_entry_service'
import { createErrorFlashMessage, createSuccessFlashMessage } from '../helpers/flash_message.js'
import { LogEntryTagService } from '#services/log_entry_tag_service'
import { createLogEntryTagValidator, deleteLogEntryTagValidator } from '#validators/log_entry_tag'
import { errors } from '@adonisjs/auth'
import { EventLoggerService } from '#services/event_logger_service'
import Exploitation from '#models/exploitation'
import LogEntry from '#models/log_entry'
import User from '#models/user'
import router from '@adonisjs/core/services/router'
import { LogEntryTagDto } from '../dto/log_entry_tag_dto.js'
import { ExploitationService } from '#services/exploitation_service'
import { LogEntryDto } from '../dto/log_entry_dto.js'
import { ExploitationDto } from '../dto/exploitation_dto.js'
import { LogEntryDocumentService } from '#services/log_entry_document_service'

// Définition centralisée des noms d'événements pour ce contrôleur
const EVENTS = {
  PAGE_VIEW: { name: 'log_entry_page_viewed', step: 'viewed' },
  CREATE_SUBMITTED: { name: 'log_entries_create', step: 'submitted' },
  CREATE_CREATED: { name: 'log_entries_create', step: 'created' },
  UPDATE_SUBMITTED: { name: 'log_entries_update', step: 'submitted' },
  UPDATE_UPDATED: { name: 'log_entries_update', step: 'updated' },
  UPDATE_FORM: { name: 'log_entries_update', step: 'form_viewed' },
  COMPLETE: { name: 'log_entries_update', step: 'completed' },
  DELETED: { name: 'log_entries_deleted' },
  TAG_CREATE_SUBMITTED: { name: 'log_entry_tags_create', step: 'submitted' },
  TAG_CREATE_CREATED: { name: 'log_entry_tags_create', step: 'created' },
  TAG_DELETED: { name: 'log_entry_tags_deleted' },
  DOCUMENT_DOWNLOADED: { name: 'log_entry_document_downloaded' },
}

@inject()
export default class LogEntriesController {
  constructor(
    public logEntryService: LogEntryService,
    public logEntryTagService: LogEntryTagService,
    public logEntryDocumentService: LogEntryDocumentService,
    public eventLogger: EventLoggerService,
    public exploitationService: ExploitationService
  ) {}

  async index({ request, inertia }: HttpContext) {
    const exploitationId = request.param('exploitationId')
    const exploitation = await Exploitation.findOrFail(exploitationId)

    return inertia.render('journal/creation', {
      exploitation: exploitation,
      filteredLogEntryTags: async () => {
        const tags = await this.logEntryTagService.getTagsForExploitation(
          exploitationId,
          request.qs().tagSearch,
          5
        )

        return LogEntryTagDto.fromArray(tags)
      },
      lastCreatedLogEntryTag: inertia.optional(async () => {
        const tags = await this.logEntryTagService.getTagsForExploitation(
          exploitationId,
          undefined,
          1
        )

        return LogEntryTagDto.fromArray(tags)
      }),
      existingLogEntryTags: inertia.optional(async () => {
        const tags = await this.logEntryTagService.getTagsForLogEntry(request.qs().logEntryId)

        return LogEntryTagDto.fromArray(tags)
      }),
      createTagForExploitationUrl: router
        .builder()
        .params([exploitationId])
        .make('log_entries.createTagForExploitation'),
      deleteTagForExploitationUrl: router
        .builder()
        .params([exploitationId])
        .make('log_entries.destroyTagForExploitation'),
      createEntryLogUrl: router.builder().params([exploitationId]).make('log_entries.create'),
    })
  }

  async get({ request, params, inertia, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const exploitationId = request.param('exploitationId')

    this.eventLogger.logEvent({
      userId: user.id,
      ...EVENTS.PAGE_VIEW,
      context: { exploitationId: exploitationId, logEntryId: params.logEntryId },
    })

    const exploitation = await Exploitation.query()
      .where('id', exploitationId)
      .preload('user')
      .firstOrFail()

    const logEntry = await LogEntry.query()
      .where('id', params.logEntryId)
      .where('exploitationId', params.exploitationId)
      .preload('tags')
      .preload('documents')
      .firstOrFail()

    const logEntryAuthor = await User.find(logEntry.userId)

    return inertia.render('journal/id', {
      logEntry: LogEntryDto.fromModel(logEntry),
      isCreator: logEntry.userId === user.id,
      exploitation: ExploitationDto.fromModel(exploitation),
      user: logEntryAuthor?.serialize(),
      deleteEntryLogUrl: router
        .builder()
        .params([exploitationId, params.logEntryId])
        .make('log_entries.destroy'),
      completeEntryLogUrl: router.builder().params([exploitationId]).make('log_entries.complete'),
    })
  }

  async getForEdition({ params, request, inertia, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    this.eventLogger.logEvent({
      userId: user.id,
      ...EVENTS.UPDATE_FORM,
      context: { exploitationId: params.exploitationId, logEntryId: params.logEntryId },
    })

    const logEntry = await LogEntry.query()
      .where('id', params.logEntryId)
      .where('exploitationId', params.exploitationId)
      .preload('tags')
      .preload('documents')
      .firstOrFail()

    const exploitation = await this.exploitationService
      .queryActiveExploitations(user.id)
      .preload('user')
      .where('id', params.exploitationId)
      .firstOrFail()

    return inertia.render('journal/edition', {
      exploitation: ExploitationDto.fromModel(exploitation),
      logEntry: LogEntryDto.fromModel(logEntry),
      isCreator: logEntry.userId === user.id,
      filteredLogEntryTags: async () => {
        const tags = await this.logEntryTagService.getTagsForExploitation(
          params.exploitationId,
          request.qs().tagSearch,
          5
        )

        return LogEntryTagDto.fromArray(tags)
      },
      lastCreatedLogEntryTag: inertia.optional(async () => {
        const tags = await this.logEntryTagService.getTagsForExploitation(
          params.exploitationId,
          undefined,
          1
        )

        return LogEntryTagDto.fromArray(tags)
      }),
      existingLogEntryTags: inertia.optional(async () => {
        const tags = await this.logEntryTagService.getTagsForLogEntry(request.qs().logEntryId)

        return LogEntryTagDto.fromArray(tags)
      }),
      createTagForExploitationUrl: router
        .builder()
        .params([params.exploitationId])
        .make('log_entries.createTagForExploitation'),
      deleteTagForExploitationUrl: router
        .builder()
        .params([params.exploitationId])
        .make('log_entries.destroyTagForExploitation'),
      editEntryLogUrl: router.builder().params([params.exploitationId]).make('log_entries.edit'),
      deleteDocumentUrl: router.builder(),
    })
  }

  async create({ auth, request, response, session, logger }: HttpContext) {
    const user = auth.getUserOrFail()
    this.eventLogger.logEvent({
      userId: user.id,
      ...EVENTS.CREATE_SUBMITTED,
      context: { payload: request.all() },
    })

    const { params, tags, documents, ...payload } =
      await request.validateUsing(createLogEntryValidator)

    let hasLogEntryCreationSucceeded = false
    try {
      // Log entry creation
      const logEntry = await this.logEntryService.createLogEntry(
        {
          userId: user.id,
          exploitationId: params.exploitationId,
          ...payload,
        },
        tags
      )

      hasLogEntryCreationSucceeded = true

      this.eventLogger.logEvent({
        userId: user.id,
        ...EVENTS.CREATE_CREATED,
      })

      // Documents upload and creation
      for (const document of documents || []) {
        await this.logEntryDocumentService.createDocument(logEntry.id, document)
      }

      createSuccessFlashMessage(session, "L'entrée de journal a été créée avec succès.")

      return response.redirect().toRoute('exploitations.get', [params.exploitationId])
    } catch (error) {
      if (!hasLogEntryCreationSucceeded) {
        logger.error(error, 'Error creating log entry:')
        createErrorFlashMessage(
          session,
          "Une erreur est survenue lors de la création de l'entrée de journal."
        )
      } else {
        logger.error(error, 'Error uploading documents for log entry:')
        createErrorFlashMessage(
          session,
          "L'entrée de journal a été créée mais une erreur est survenue lors de l'import des documents."
        )
        return response.redirect().toRoute('exploitations.get', [params.exploitationId])
      }
    }

    return response.redirect().back()
  }

  async edit({ auth, request, response, session, logger }: HttpContext) {
    const user = auth.getUserOrFail()
    this.eventLogger.logEvent({
      userId: user.id,
      ...EVENTS.UPDATE_SUBMITTED,
      context: { payload: request.all() },
    })
    const { id, params, tags, documents, ...payload } =
      await request.validateUsing(updateLogEntryValidator)

    try {
      await this.logEntryService.updateLogEntry(id, user.id, params.exploitationId, payload, tags)

      this.eventLogger.logEvent({
        userId: user.id,
        ...EVENTS.UPDATE_UPDATED,
      })

      // Documents upload and creation
      for (const document of documents || []) {
        await this.logEntryDocumentService.createDocument(id, document)
      }

      createSuccessFlashMessage(session, "L'entrée de journal a été mise à jour avec succès.")
      return response.redirect().toRoute('exploitations.get', [params.exploitationId])
    } catch (error) {
      logger.error(error, 'Error updating log entry:')
      if (error.code === errors.E_UNAUTHORIZED_ACCESS.code) {
        createErrorFlashMessage(session, 'Vous ne pouvez éditer que vos entrées de journal.')
      } else {
        createErrorFlashMessage(
          session,
          "Une erreur est survenue lors de la mise à jour de l'entrée de journal."
        )
      }
    }

    return response.redirect().back()
  }

  async complete({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()

    const { id, params } = await request.validateUsing(completeLogEntryValidator)

    this.eventLogger.logEvent({
      userId: user.id,
      ...EVENTS.COMPLETE,
      context: { payload: request.all() },
    })

    try {
      await this.logEntryService.updateLogEntry(id, user.id, params.exploitationId, {
        isCompleted: true,
      })

      createSuccessFlashMessage(session, 'La tâche a été marquée comme terminée.')
    } catch (error) {
      createErrorFlashMessage(
        session,
        'Une erreur est survenue lors de la mise à jour de la tâche.'
      )
    }
    return response.redirect().back()
  }

  async destroy({ auth, request, response, session, logger }: HttpContext) {
    const user = auth.getUserOrFail()
    this.eventLogger.logEvent({
      userId: user.id,
      ...EVENTS.DELETED,
      context: { payload: request.all() },
    })
    const { id, params } = await request.validateUsing(destroyLogEntryValidator)

    try {
      await this.logEntryService.deleteLogEntry(id, user.id, params.exploitationId)
      createSuccessFlashMessage(session, "L'entrée de journal a été supprimée avec succès.")
    } catch (error) {
      logger.error(error, 'Error deleting log entry:')
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
      ...EVENTS.TAG_CREATE_SUBMITTED,
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
        ...EVENTS.TAG_CREATE_CREATED,
      })
    } catch (error) {
      logger.error(error, 'Error creating tag for exploitation:')
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
      ...EVENTS.TAG_DELETED,
    })
    const payload = await request.validateUsing(deleteLogEntryTagValidator)

    try {
      await this.logEntryTagService.deleteTag(payload.tagId, payload.params.exploitationId, user.id)
    } catch (error) {
      logger.error(error, 'Error deleting tag:')
      createErrorFlashMessage(
        session,
        "Une erreur est survenue lors de la suppression de l'étiquette."
      )
    }
    return response.redirect().back()
  }

  async downloadDocument({ auth, request, response, logger, session, inertia }: HttpContext) {
    const user = auth.getUserOrFail()

    const { params } = await request.validateUsing(downloadDocumentValidator)

    this.eventLogger.logEvent({
      userId: user.id,
      ...EVENTS.DOCUMENT_DOWNLOADED,
      context: { params },
    })

    try {
      const document = await this.logEntryService.findDocument(params.documentId, user.id)

      if (!document) {
        logger.error(`Document with ID ${params.documentId} not found for user ${user.id}`)
        createErrorFlashMessage(session, 'Impossible de trouver le document.')
        return response.redirect().back()
      }

      const url = await this.logEntryDocumentService.getDocumentUrl(document.s3Key)

      return inertia.location(url)
    } catch (error) {
      logger.error(error, 'Error downloading document:')
      createErrorFlashMessage(
        session,
        'Une erreur est survenue lors du téléchargement du document.'
      )
      return response.redirect().back()
    }
  }
}
