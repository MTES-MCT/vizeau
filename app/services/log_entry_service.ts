import LogEntry from '#models/log_entry'
import { errors } from '@adonisjs/auth'
import { ModelAttributes } from '@adonisjs/lucid/types/model'
import LogEntryDocument from '#models/log_entry_document'

export class LogEntryService {
  /**
   * Returns a query builder for log entries that belong to exploitations that are not marked as deleted.
   */
  queryLogEntriesFromActiveExploitation() {
    return LogEntry.query().whereHas('exploitation', (exploitationQuery) => {
      exploitationQuery.where('isDeleted', false)
    })
  }

  async createLogEntry(logData: Partial<ModelAttributes<LogEntry>>, tagsIds?: number[]) {
    const logEntry = await LogEntry.create(logData)

    if (tagsIds && tagsIds.length > 0) {
      await logEntry.related('tags').attach(tagsIds)
    }

    return logEntry
  }

  async getAllLogEntriesForExploitation(exploitationId: string) {
    return this.queryLogEntriesFromActiveExploitation()
      .where('exploitationId', exploitationId)
      .preload('author')
      .preload('tags')
      .orderBy('date', 'desc')
  }

  async getLogForExploitation(exploitationId: string, page = 1, pageSize = 10) {
    return this.queryLogEntriesFromActiveExploitation()
      .where('exploitationId', exploitationId)
      .preload('author')
      .preload('tags')
      .preload('documents')
      .orderBy('createdAt', 'desc')
      .paginate(page, pageSize)
  }

  // Request used on the home page
  async getLatestLogEntriesFromUser(userId: string, limit = 5) {
    return (
      this.queryLogEntriesFromActiveExploitation()
        // We want to only show the current user's entries on the home page
        .where('userId', userId)
        // Only show entries from exploitations that share at least one territoire with the user (same as the exploitations shown on the home page)
        .whereHas('exploitation', (exploitationQuery) => {
          exploitationQuery.whereHas('territoires', (territoireQuery) => {
            territoireQuery.whereHas('users', (userQuery) => {
              userQuery.where('users.id', userId)
            })
          })
        })
        .preload('tags')
        .preload('exploitation')
        .orderBy('createdAt', 'desc')
        .limit(limit)
    )
  }

  async findDocument(documentId: number, userId: string) {
    return LogEntryDocument.query()
      .where('id', documentId)
      .andWhereHas('logEntry', (logEntryQuery) => {
        logEntryQuery.whereHas('exploitation', (exploitationQuery) => {
          exploitationQuery.where('userId', userId).andWhere('isDeleted', false)
        })
      })
      .first()
  }

  // We require the exploitationId to ensure the log entry belongs to the correct exploitation
  async updateLogEntry(
    id: string,
    userId: string,
    exploitationId: string,
    logData: Partial<ModelAttributes<LogEntry>>,
    tagsIds?: number[]
  ) {
    const logEntry = await this.queryLogEntriesFromActiveExploitation()
      .where('id', id)
      .andWhere('exploitationId', exploitationId)
      .firstOrFail()

    if (logEntry.userId !== userId) {
      throw errors.E_UNAUTHORIZED_ACCESS
    }

    if (logData.isCompleted === true && logEntry.date === null) {
      throw new Error('Une note de journal doit avoir une date pour être marquée comme effectuée.')
    }

    logEntry.merge(logData)
    await logEntry.save()

    if (tagsIds !== undefined) {
      await logEntry.related('tags').sync(tagsIds)
    }
    return logEntry
  }

  // We require the exploitationId to ensure the log entry belongs to the correct exploitation
  async deleteLogEntry(id: string, userId: string, exploitationId: string) {
    const logEntry = await this.queryLogEntriesFromActiveExploitation()
      .where('id', id)
      .andWhere('exploitationId', exploitationId)
      .firstOrFail()

    if (logEntry.userId !== userId) {
      throw errors.E_UNAUTHORIZED_ACCESS
    }

    await logEntry.delete()
    return logEntry
  }
}
