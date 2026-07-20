import { beforeCreate, manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import { randomUUID } from 'node:crypto'
import Project from '#models/project'
import { CaptageSchema } from '#database/schema'

export default class Captage extends CaptageSchema {
  static table = 'captages'
  static selfAssignPrimaryKey = true

  @beforeCreate()
  static assignUuid(captage: Captage) {
    captage.id = randomUUID()
  }

  @manyToMany(() => Project, {
    pivotTable: 'project_captage_relations',
    pivotTimestamps: true,
  })
  declare projects: ManyToMany<typeof Project>
}
