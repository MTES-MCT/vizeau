import { beforeCreate, belongsTo, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import { randomUUID } from 'node:crypto'
import User from '#models/user'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import Exploitation from '#models/exploitation'
import LogEntryTag from '#models/log_entry_tag'
import LogEntryDocument from '#models/log_entry_document'
import { LogEntrySchema } from '#database/schema'

export const LogEntryTagsRelationTable = 'log_entry_tag_relations'

export default class LogEntry extends LogEntrySchema {
  static table = 'log_entries'
  // Disable primary key generation by the DB
  static selfAssignPrimaryKey = true

  // Auto-generate UUID before DB insertion
  @beforeCreate()
  static assignUuid(logEntry: LogEntry) {
    logEntry.id = randomUUID()
  }

  @belongsTo(() => User)
  declare author: BelongsTo<typeof User>

  @belongsTo(() => Exploitation)
  declare exploitation: BelongsTo<typeof Exploitation>

  @manyToMany(() => LogEntryTag, {
    pivotTable: LogEntryTagsRelationTable,
    pivotTimestamps: true,
  })
  declare tags: ManyToMany<typeof LogEntryTag>

  @hasMany(() => LogEntryDocument)
  declare documents: HasMany<typeof LogEntryDocument>
}
