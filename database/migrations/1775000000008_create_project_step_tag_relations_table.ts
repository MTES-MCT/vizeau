import { BaseSchema } from '@adonisjs/lucid/schema'
import { ProjectStepTagsRelationTable } from '#models/project_step'

export default class extends BaseSchema {
  protected tableName = ProjectStepTagsRelationTable

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table
        .uuid('project_step_id')
        .notNullable()
        .references('id')
        .inTable('project_steps')
        .onDelete('CASCADE')
      table
        .integer('project_step_tag_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('project_step_tags')
        .onDelete('CASCADE')

      table.primary(['project_step_id', 'project_step_tag_id'])

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
