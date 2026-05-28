import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, manyToMany } from '@adonisjs/lucid/orm'
import User from '#models/user'
import type { BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations'
import ProjectStep from '#models/project_step'

export default class ProjectStepTag extends BaseModel {
  static table = 'project_step_tags'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare userId: string

  @belongsTo(() => User)
  declare owner: BelongsTo<typeof User>

  @manyToMany(() => ProjectStep, {
    pivotTable: 'project_step_tag_relations',
    pivotTimestamps: true,
  })
  declare steps: ManyToMany<typeof ProjectStep>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
