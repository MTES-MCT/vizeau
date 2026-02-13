import { BaseSchema } from '@adonisjs/lucid/schema'
import LogEntryDocument from '#models/log_entry_document'
import LogEntry from '#models/log_entry'

export default class extends BaseSchema {
  protected tableName = LogEntryDocument.table

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .uuid('log_entry_id')
        .notNullable()
        .references('id')
        .inTable(LogEntry.table)
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
