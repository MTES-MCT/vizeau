import { LogEntryDocumentJson } from '../../types/models.js'
import LogEntryDocument from '#models/log_entry_document'
import router from '@adonisjs/core/services/router'

export class LogEntryDocumentDto {
  static fromModel(document: LogEntryDocument): LogEntryDocumentJson {
    return {
      id: document.id,
      name: document.name,
      logEntryId: document.logEntryId,
      sizeInBytes: document.sizeInBytes,
      href: router.builder().params([document.id]).make('log_entries.downloadDocument'),
    }
  }

  static fromArray(documents: LogEntryDocument[]): LogEntryDocumentJson[] {
    return documents.map(LogEntryDocumentDto.fromModel)
  }
}
