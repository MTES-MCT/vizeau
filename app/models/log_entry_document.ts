import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import LogEntry from '#models/log_entry'

export default class LogEntryDocument extends BaseModel {
  static table = 'log_entry_documents'
  // Disable primary key generation by the DB
  static selfAssignPrimaryKey = true

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
}
