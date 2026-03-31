import { DateTime } from 'luxon'
import {
  BaseModel,
  beforeCreate,
  belongsTo,
  column,
  hasMany,
  manyToMany,
} from '@adonisjs/lucid/orm'
import { randomUUID } from 'node:crypto'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Exploitation from '#models/exploitation'

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

  // For now, territoires are strictly AACs, so code corresponds to the official AAC code.
  @column()
  declare code: string | null

  @column()
  declare parentTerritoireId: string | null

  @belongsTo(() => Territoire)
  declare parentTerritoire: BelongsTo<typeof Territoire>

  @hasMany(() => Territoire)
  declare subTerritoires: HasMany<typeof Territoire>

  @manyToMany(() => Exploitation, {
    pivotTable: 'exploitation_territoire_relations',
    pivotTimestamps: true,
  })
  declare exploitations: ManyToMany<typeof Exploitation>

  @manyToMany(() => User, {
    pivotTable: 'territoire_user_relations',
    pivotTimestamps: true,
  })
  declare users: ManyToMany<typeof User>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
