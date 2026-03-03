import LogEntry from '#models/log_entry'
import { LogEntryJson, PaginatedJson } from '../../types/models.js'
import { LogEntryTagDto } from './log_entry_tag_dto.js'
import { ModelPaginatorContract } from '@adonisjs/lucid/types/model'
import { LogEntryDocumentDto } from './log_entry_document_dto.js'
import { ExploitationDto } from './exploitation_dto.js'

export class LogEntryDto {
  static fromModel(logEntry: LogEntry): LogEntryJson {
    return {
      id: logEntry.id,
      userId: logEntry.userId,
      exploitationId: logEntry.exploitationId,
      exploitation: logEntry.exploitation
        ? ExploitationDto.fromModel(logEntry.exploitation)
        : undefined,
      title: logEntry.title,
      notes: logEntry.notes,
      createdAt: logEntry.createdAt.toISO() as string,
      updatedAt: logEntry.updatedAt.toISO() as string,
      tags: logEntry.tags.map((tag) => LogEntryTagDto.fromModel(tag)),
      documents: logEntry.documents?.map((document) => LogEntryDocumentDto.fromModel(document)),
      date: logEntry.date ? (logEntry.date.toISODate() as string) : null,
      isCompleted: logEntry.isCompleted,
    }
  }

  static fromPaginator(
    paginatedLogEntries: ModelPaginatorContract<LogEntry>
  ): PaginatedJson<LogEntryJson> {
    const transformedData = (paginatedLogEntries.toJSON().data as LogEntry[]).map(
      LogEntryDto.fromModel
    )

    return {
      meta: paginatedLogEntries.getMeta(),
      data: transformedData,
    }
  }
}
