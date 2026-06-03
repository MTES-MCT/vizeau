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
import Project from '#models/project'
import ProjectStepTag from '#models/project_step_tag'
import ProjectStepDocument from '#models/project_step_document'

export const ProjectStepTagsRelationTable = 'project_step_tag_relations'

export default class ProjectStep extends BaseModel {
  static table = 'project_steps'
  static selfAssignPrimaryKey = true

  @column({ isPrimary: true })
  declare id: string

  @beforeCreate()
  static assignUuid(step: ProjectStep) {
    step.id = randomUUID()
  }

  @column()
  declare projectId: string

  @belongsTo(() => Project)
  declare project: BelongsTo<typeof Project>

  @column()
  declare title: string

  @column()
  declare note: string | null

  @column.date()
  declare date: DateTime | null

  @column()
  declare isValidated: boolean

  @manyToMany(() => ProjectStepTag, {
    pivotTable: ProjectStepTagsRelationTable,
    pivotTimestamps: true,
  })
  declare tags: ManyToMany<typeof ProjectStepTag>

  @hasMany(() => ProjectStepDocument)
  declare documents: HasMany<typeof ProjectStepDocument>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
