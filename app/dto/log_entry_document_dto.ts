import { type LogEntryDocumentJson } from '#types/models'
import type LogEntryDocument from '#models/log_entry_document'
import { urlFor } from '@adonisjs/core/services/url_builder'

export class LogEntryDocumentDto {
  static fromModel(document: LogEntryDocument): LogEntryDocumentJson {
    return {
      id: document.id,
      name: document.name,
      logEntryId: document.logEntryId,
      sizeInBytes: document.sizeInBytes,
      href: urlFor('log_entries.downloadDocument', { documentId: document.id }),
    }
  }

  static fromArray(documents: LogEntryDocument[]): LogEntryDocumentJson[] {
    return documents.map(LogEntryDocumentDto.fromModel)
  }
}
