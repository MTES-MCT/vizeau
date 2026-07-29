import { beforeCreate, belongsTo, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import { randomUUID } from 'node:crypto'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Exploitation from '#models/exploitation'
import Project from '#models/project'
import { TerritoireSchema } from '#database/schema'

export default class Territoire extends TerritoireSchema {
  static table = 'territoires'
  // Disable primary key generation by the DB
  static selfAssignPrimaryKey = true

  // Auto-generate UUID before DB insertion
  @beforeCreate()
  static assignUuid(territoire: Territoire) {
    territoire.id = randomUUID()
  }

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

  @manyToMany(() => Project, {
    pivotTable: 'project_territoire_relations',
    pivotTimestamps: true,
  })
  declare projects: ManyToMany<typeof Project>
}
