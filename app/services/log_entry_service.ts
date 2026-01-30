import LogEntry from '#models/log_entry'
import { errors } from '@adonisjs/auth'

export class LogEntryService {
  async createLogEntry(logData: {
    title?: string | null
    notes?: string | null
    userId: string
    exploitationId: string
    tags?: number[]
  }) {
    const logEntry = await LogEntry.create(logData)

    if (logData.tags && logData.tags.length > 0) {
      await logEntry.related('tags').attach(logData.tags)
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

  // We require the exploitationId to ensure the log entry belongs to the correct exploitation
  async updateLogEntry(
    id: string,
    userId: string,
    exploitationId: string,
    logData: { title?: string | null; notes?: string | null; tags?: number[] }
  ) {
    const logEntry = await LogEntry.findByOrFail({ id, exploitationId })

    if (logEntry.userId !== userId) {
      throw errors.E_UNAUTHORIZED_ACCESS
    }

    logEntry.merge(logData)
    await logEntry.save()

    if (logData.tags !== undefined) {
      await logEntry.related('tags').sync(logData.tags)
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
