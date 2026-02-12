import { DateTime } from 'luxon'
import { BaseModel, beforeDelete, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import LogEntry from '#models/log_entry'
import { LogEntryDocumentService } from '#services/log_entry_document_service'

export default class LogEntryDocument extends BaseModel {
  static table = 'log_entry_documents'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare logEntryId: string

  @belongsTo(() => LogEntry)
  declare logEntry: BelongsTo<typeof LogEntry>

  @column()
  declare name: string

  @column({ columnName: 's3_key' })
  declare s3Key: string

  @column()
  declare sizeInBytes: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @beforeDelete()
  static async beforeDeleteHook(logEntryDocument: LogEntryDocument) {
    // Delete the file from S3 before deleting the DB record
    const service = new LogEntryDocumentService()
    await service.deleteDocument(logEntryDocument.s3Key)
  }
}
