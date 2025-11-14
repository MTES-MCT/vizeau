import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import { randomUUID } from 'node:crypto'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'

export default class Territoire extends BaseModel {
  static table = 'territoires'
  // Disable primary key generation by the DB
  static selfAssignPrimaryKey = true

  @column({ isPrimary: true })
  declare id: string

  // Auto-generate UUID before DB insertion
  @beforeCreate()
  static assignUuid(territoire: Territoire) {
    territoire.id = randomUUID()
  }

  @column()
  declare name: string | null

  @column()
  declare parentTerritoireId: string | null

  @belongsTo(() => Territoire)
  declare parentTerritoire: BelongsTo<typeof Territoire>

  @hasMany(() => Territoire)
  declare subTerritoires: HasMany<typeof Territoire>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
