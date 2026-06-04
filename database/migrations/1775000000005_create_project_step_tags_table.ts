import { BaseSchema } from '@adonisjs/lucid/schema'
import ProjectStepTag from '#models/project_step_tag'
import User from '#models/user'

export default class extends BaseSchema {
  protected tableName = ProjectStepTag.table

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned()

      table.string('name').notNullable()
      table.uuid('user_id').references('id').inTable(User.table).onDelete('CASCADE').notNullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
