import { beforeDelete, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import LogEntry from '#models/log_entry'
import { LogEntryDocumentService } from '#services/log_entry_document_service'
import { LogEntryDocumentSchema } from '#database/schema'

export default class LogEntryDocument extends LogEntryDocumentSchema {
  static table = 'log_entry_documents'

  @belongsTo(() => LogEntry)
  declare logEntry: BelongsTo<typeof LogEntry>

  @column({ columnName: 's3_key' })
  declare s3Key: string

  @beforeDelete()
  static async beforeDeleteHook(logEntryDocument: LogEntryDocument) {
    // Delete the file from S3 before deleting the DB record
    const service = new LogEntryDocumentService()
    try {
      await service.deleteDocument(logEntryDocument.s3Key)
    } catch (error) {
      // Log the error but don't prevent the deletion of the DB record
      console.error(`Failed to delete document from S3 with key ${logEntryDocument.s3Key}:`, error)
    }
  }
}
