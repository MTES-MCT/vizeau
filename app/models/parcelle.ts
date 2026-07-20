import { beforeCreate, belongsTo, column, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import { randomUUID } from 'node:crypto'
import Exploitation from '#models/exploitation'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import Culture from '#models/culture'
import Project from '#models/project'
import { ParcelleSchema } from '#database/schema'
import ParcelleComment from '#models/parcelle_comment'

export default class Parcelle extends ParcelleSchema {
  static table = 'parcelles'
  // Disable primary key generation by the DB
  static selfAssignPrimaryKey = true

  // Auto-generate UUID before DB insertion
  @beforeCreate()
  static assignUuid(parcelle: Parcelle) {
    parcelle.id = randomUUID()
  }

  @belongsTo(() => Exploitation)
  declare exploitation: BelongsTo<typeof Exploitation>

  @hasMany(() => ParcelleComment)
  declare comments: HasMany<typeof ParcelleComment>

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
  // @ts-expect-error the schema exposes the raw DB string, this narrows it to the parsed object
  declare centroid: { x: number; y: number } | null

  @belongsTo(() => Culture, { localKey: 'code', foreignKey: 'cultureCode' })
  declare culture: BelongsTo<typeof Culture>

  @manyToMany(() => Project, {
    pivotTable: 'project_parcelle_relations',
    pivotTimestamps: true,
  })
  declare projects: ManyToMany<typeof Project>
}
