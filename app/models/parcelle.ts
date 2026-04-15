import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, belongsTo, column } from '@adonisjs/lucid/orm'
import { randomUUID } from 'node:crypto'
import Exploitation from '#models/exploitation'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
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

  @column()
  declare comment: string | null

  /*
    Stored as "POINT(lng,lat)" in database
   */
  @column({
    prepare: (value: { x: number; y: number } | null | undefined) => {
      if (value === null || value === undefined) {
        return null
      }

      return `(${value.x},${value.y})`
    },
  })
  declare centroid: { x: number; y: number } | null

  @belongsTo(() => Culture, { localKey: 'code', foreignKey: 'cultureCode' })
  declare culture: BelongsTo<typeof Culture>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
