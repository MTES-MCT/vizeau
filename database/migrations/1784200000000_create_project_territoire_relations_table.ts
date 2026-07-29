import { BaseSchema } from '@adonisjs/lucid/schema'
import Project from '#models/project'
import Territoire from '#models/territoire'

export default class extends BaseSchema {
  protected tableName = 'project_territoire_relations'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .uuid('project_id')
        .notNullable()
        .references('id')
        .inTable(Project.table)
        .onDelete('CASCADE')

      table
        .uuid('territoire_id')
        .notNullable()
        .references('id')
        .inTable(Territoire.table)
        .onDelete('CASCADE')

      table.unique(['project_id', 'territoire_id'])

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
