import { BaseSchema } from '@adonisjs/lucid/schema'
import Territoire from '#models/territoire'

export default class extends BaseSchema {
  protected tableName = Territoire.table

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().notNullable()

      table.string('name').nullable()
      table
        .uuid('parent_territoire_id')
        .nullable()
        .references('id')
        .inTable(this.tableName)
        .onDelete('SET NULL')

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
