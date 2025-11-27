import { BaseSchema } from '@adonisjs/lucid/schema'
import LogEntryTag from '#models/log_entry_tag'
import User from '#models/user'
import Exploitation from '#models/exploitation'

export default class extends BaseSchema {
  protected tableName = LogEntryTag.table

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').unsigned()

      table.string('name').notNullable()
      table.uuid('user_id').references('id').inTable(User.table).onDelete('CASCADE').notNullable()
      table
        .uuid('exploitation_id')
        .references('id')
        .inTable(Exploitation.table)
        .onDelete('CASCADE')
        .notNullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
