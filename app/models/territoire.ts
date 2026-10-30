import { beforeCreate, belongsTo, column, hasMany, manyToMany, scope } from '@adonisjs/lucid/orm'
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

  // Exploitations cannot be assigned to or updated on an inactive territoire
  @column()
  declare isActive: boolean

  // Auto-generate UUID before DB insertion
  @beforeCreate()
  static assignUuid(territoire: Territoire) {
    territoire.id = randomUUID()
  }

  /*
    Order by code as integer if it exists, otherwise by name.
    Codes are stored as strings but are numeric, so a plain string sort would put "10" before "2".
    Territoires without a code (rare) appear after those with codes, sorted alphabetically by name.
   */
  static orderByCode = scope((query) => {
    query.orderByRaw(
      `CASE WHEN territoires.code ~ '^[0-9]+$' THEN territoires.code::int END ASC NULLS LAST,
        territoires.code ASC NULLS LAST,
        territoires.name ASC`
    )
  })

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
