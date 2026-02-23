import LogEntry from '#models/log_entry'
import { errors } from '@adonisjs/auth'
import { ModelAttributes } from '@adonisjs/lucid/types/model'
import LogEntryDocument from '#models/log_entry_document'
import Env from '#start/env'

export class LogEntryService {
  async createLogEntry(logData: Partial<ModelAttributes<LogEntry>>, tagsIds?: number[]) {
    const logEntry = await LogEntry.create(logData)

    if (tagsIds && tagsIds.length > 0) {
      await logEntry.related('tags').attach(tagsIds)
    }

    return logEntry
  }

  async getLogForExploitation(exploitationId: string, page = 1, pageSize = 10) {
    return LogEntry.query()
      .where('exploitationId', exploitationId)
      .preload('author')
      .preload('tags')
      .orderBy('createdAt', 'desc')
      .paginate(page, pageSize)
  }

  async getLatestLogEntriesFromUser(userId: string, limit = 5) {
    return LogEntry.query()
      .where('userId', userId)
      .preload('tags')
      .preload('exploitation', (query) => {
        query.select('id', 'name')
      })
      .orderBy('createdAt', 'desc')
      .limit(limit)
  }

  async findDocument(documentId: number, userId: string) {
    return LogEntryDocument.query()
      .where('id', documentId)
      .andWhereHas('logEntry', (logEntryQuery) => {
        logEntryQuery.whereHas('exploitation', (exploitationQuery) => {
          exploitationQuery.where('userId', userId).orWhereHas('user', (userQuery) => {
            userQuery.where('email', Env.get('ADMIN_EMAIL'))
          })
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
    const logEntry = await LogEntry.findByOrFail({ id, exploitationId })

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
    const logEntry = await LogEntry.findByOrFail({ id, exploitationId })

    if (logEntry.userId !== userId) {
      throw errors.E_UNAUTHORIZED_ACCESS
    }

    await logEntry.delete()
    return logEntry
  }
}
