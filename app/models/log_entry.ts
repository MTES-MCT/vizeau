import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, belongsTo, column, manyToMany } from '@adonisjs/lucid/orm'
import { randomUUID } from 'node:crypto'
import User from '#models/user'
import type { BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations'
import Exploitation from '#models/exploitation'
import LogEntryTag from '#models/log_entry_tag'

export const LogEntryTagsRelationTable = 'log_entry_tag_relations'

export default class LogEntry extends BaseModel {
  static table = 'log_entries'
  // Disable primary key generation by the DB
  static selfAssignPrimaryKey = true

  @column({ isPrimary: true })
  declare id: string

  // Auto-generate UUID before DB insertion
  @beforeCreate()
  static assignUuid(logEntry: LogEntry) {
    logEntry.id = randomUUID()
  }

  @column()
  declare title: string | null

  @column()
  declare notes: string | null

  @column()
  declare userId: string

  @belongsTo(() => User)
  declare author: BelongsTo<typeof User>

  @column()
  declare exploitationId: string

  @belongsTo(() => Exploitation)
  declare exploitation: BelongsTo<typeof Exploitation>

  @manyToMany(() => LogEntryTag, {
    pivotTable: LogEntryTagsRelationTable,
    pivotTimestamps: true,
  })
  declare tags: ManyToMany<typeof LogEntryTag>

  @column.date()
  declare date: DateTime | null

  @column()
  declare isCompleted: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
