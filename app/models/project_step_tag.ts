import { belongsTo, manyToMany } from '@adonisjs/lucid/orm'
import User from '#models/user'
import type { BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations'
import ProjectStep from '#models/project_step'
import { ProjectStepTagSchema } from '#database/schema'

export default class ProjectStepTag extends ProjectStepTagSchema {
  static table = 'project_step_tags'

  @belongsTo(() => User)
  declare owner: BelongsTo<typeof User>

  @manyToMany(() => ProjectStep, {
    pivotTable: 'project_step_tag_relations',
    pivotTimestamps: true,
  })
  declare steps: ManyToMany<typeof ProjectStep>
}
