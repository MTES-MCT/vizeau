import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, column, manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import { randomUUID } from 'node:crypto'
import Project from '#models/project'

export default class Captage extends BaseModel {
  static table = 'captages'
  static selfAssignPrimaryKey = true

  @column({ isPrimary: true })
  declare id: string

  @beforeCreate()
  static assignUuid(captage: Captage) {
    captage.id = randomUUID()
  }

  @column()
  declare code: string

  @column()
  declare name: string

  @column()
  declare bssCode: string

  @column()
  declare state: string

  @manyToMany(() => Project, {
    pivotTable: 'project_captage_relations',
    pivotTimestamps: true,
  })
  declare projects: ManyToMany<typeof Project>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
