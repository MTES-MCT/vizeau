import { beforeCreate, belongsTo, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import { randomUUID } from 'node:crypto'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import Project from '#models/project'
import ProjectStepTag from '#models/project_step_tag'
import ProjectStepDocument from '#models/project_step_document'
import { ProjectStepSchema } from '#database/schema'

export const ProjectStepTagsRelationTable = 'project_step_tag_relations'

export default class ProjectStep extends ProjectStepSchema {
  static table = 'project_steps'
  static selfAssignPrimaryKey = true

  @beforeCreate()
  static assignUuid(step: ProjectStep) {
    step.id = randomUUID()
  }

  @belongsTo(() => Project)
  declare project: BelongsTo<typeof Project>

  @manyToMany(() => ProjectStepTag, {
    pivotTable: ProjectStepTagsRelationTable,
    pivotTimestamps: true,
  })
  declare tags: ManyToMany<typeof ProjectStepTag>

  @hasMany(() => ProjectStepDocument)
  declare documents: HasMany<typeof ProjectStepDocument>
}
