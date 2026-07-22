import { beforeCreate, belongsTo, column, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import { randomUUID } from 'node:crypto'
import Exploitation from '#models/exploitation'
import Parcelle from '#models/parcelle'
import Captage from '#models/captage'
import User from '#models/user'
import Territoire from '#models/territoire'
import ProjectStep from '#models/project_step'
import { ProjectSchema } from '#database/schema'

export const ProjectStatus = {
  TO_BE_STARTED: 'to_be_started',
  CURRENT: 'current',
  COMPLETED: 'completed',
  ABANDONED: 'abandoned',
} as const

export default class Project extends ProjectSchema {
  static table = 'projects'
  static selfAssignPrimaryKey = true

  @beforeCreate()
  static assignUuid(project: Project) {
    project.id = randomUUID()
  }

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @manyToMany(() => Territoire, {
    pivotTable: 'project_territoire_relations',
    pivotTimestamps: true,
  })
  declare territoires: ManyToMany<typeof Territoire>

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
}
