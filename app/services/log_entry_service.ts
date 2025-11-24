import LogEntry from '#models/log_entry'

export class LogEntryService {
  async createLogEntry(logData: {
    notes?: string
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

  async updateLogEntry(id: string, logData: { notes?: string; tags?: number[] }) {
    const logEntry = await LogEntry.findOrFail(id)
    if (logData.notes !== undefined) {
      logEntry.notes = logData.notes
      await logEntry.save()
    }
    if (logData.tags !== undefined) {
      await logEntry.related('tags').sync(logData.tags)
    }
    return logEntry
  }

  async deleteLogEntry(id: string) {
    const logEntry = await LogEntry.findOrFail(id)
    await logEntry.delete()
    return logEntry
  }
}
