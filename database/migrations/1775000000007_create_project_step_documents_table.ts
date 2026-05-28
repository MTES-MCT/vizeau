import { BaseSchema } from '@adonisjs/lucid/schema'
import ProjectStepDocument from '#models/project_step_document'

export default class extends BaseSchema {
  protected tableName = ProjectStepDocument.table

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .uuid('project_step_id')
        .notNullable()
        .references('id')
        .inTable('project_steps')
        .onDelete('CASCADE')
      table.string('name').notNullable()
      table.string('s3_key').notNullable()
      table.integer('size_in_bytes').notNullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
