import { BaseSchema } from '@adonisjs/lucid/schema'
import ProjectStep from '#models/project_step'

export default class extends BaseSchema {
  protected tableName = ProjectStep.table

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('title').nullable().alter()
    })
  }

  async down() {
    this.defer(async (db) => {
      await db.from(this.tableName).whereNull('title').update({ title: '' })
    })
    this.schema.alterTable(this.tableName, (table) => {
      table.string('title').notNullable().alter()
    })
  }
}
