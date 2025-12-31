import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, belongsTo, column, hasOne } from '@adonisjs/lucid/orm'
import { randomUUID } from 'node:crypto'
import Exploitation from '#models/exploitation'
import type { BelongsTo, HasOne } from '@adonisjs/lucid/types/relations'
import Culture from '#models/culture'

export default class Parcelle extends BaseModel {
  static table = 'parcelles'
  // Disable primary key generation by the DB
  static selfAssignPrimaryKey = true

  @column({ isPrimary: true })
  declare id: string

  // Auto-generate UUID before DB insertion
  @beforeCreate()
  static assignUuid(parcelle: Parcelle) {
    parcelle.id = randomUUID()
  }

  @column()
  declare exploitationId: string | null

  @belongsTo(() => Exploitation)
  declare exploitation: BelongsTo<typeof Exploitation>

  @column()
  declare year: number

  @column()
  declare rpgId: string

  @column()
  declare surface: number | null

  @column()
  declare cultureCode: string | null

  @hasOne(() => Culture, { localKey: 'culture_code', foreignKey: 'code' })
  declare culture: HasOne<typeof Culture>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
