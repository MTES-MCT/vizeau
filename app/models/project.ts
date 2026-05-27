import { DateTime } from 'luxon'
import {
  BaseModel,
  beforeCreate,
  belongsTo,
  column,
  hasMany,
  manyToMany,
} from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import { randomUUID } from 'node:crypto'
import Exploitation from '#models/exploitation'
import Parcelle from '#models/parcelle'
import Captage from '#models/captage'
import User from '#models/user'
import ProjectStep from '#models/project_step'

export const ProjectStatus = {
  TO_BE_STARTED: 'to_be_started',
  CURRENT: 'current',
  COMPLETED: 'completed',
  ABANDONED: 'abandoned',
} as const

export default class Project extends BaseModel {
  static table = 'projects'
  static selfAssignPrimaryKey = true

  @column({ isPrimary: true })
  declare id: string

  @beforeCreate()
  static assignUuid(project: Project) {
    project.id = randomUUID()
  }

  @column()
  declare name: string

  @column()
  declare description: string | null

  @column()
  declare actionType: string | null

  @column()
  declare userId: string

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @column()
  declare status: (typeof ProjectStatus)[keyof typeof ProjectStatus]

  @manyToMany(() => Parcelle, {
    pivotTable: 'project_parcelle_relations',
    pivotTimestamps: true,
  })
  declare parcelles: ManyToMany<typeof Parcelle>

  @manyToMany(() => Exploitation, {
    pivotTable: 'project_exploitation_relations',
    pivotTimestamps: true,
  })
  declare exploitations: ManyToMany<typeof Exploitation>

  @manyToMany(() => Captage, {
    pivotTable: 'project_captage_relations',
    pivotTimestamps: true,
  })
  declare captages: ManyToMany<typeof Captage>

  @hasMany(() => ProjectStep)
  declare steps: HasMany<typeof ProjectStep>

  @column.dateTime()
  declare closedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
