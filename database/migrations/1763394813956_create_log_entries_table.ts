import { BaseSchema } from '@adonisjs/lucid/schema'
import LogEntry from '#models/log_entry'
import User from '#models/user'
import Exploitation from '#models/exploitation'

export default class extends BaseSchema {
  protected tableName = LogEntry.table

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().notNullable()
      table.text('notes').notNullable()
      table.uuid('user_id').notNullable().references('id').inTable(User.table).onDelete('CASCADE')
      table
        .uuid('exploitation_id')
        .notNullable()
        .references('id')
        .inTable(Exploitation.table)
        .onDelete('CASCADE')

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
