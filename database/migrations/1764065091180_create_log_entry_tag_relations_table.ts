import { BaseSchema } from '@adonisjs/lucid/schema'
import LogEntry, { LogEntryTagsRelationTable } from '#models/log_entry'
import LogEntryTag from '#models/log_entry_tag'

export default class extends BaseSchema {
  protected tableName = LogEntryTagsRelationTable

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .uuid('log_entry_id')
        .notNullable()
        .references('id')
        .inTable(LogEntry.table)
        .onDelete('CASCADE')
      table
        .integer('log_entry_tag_id')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable(LogEntryTag.table)
        .onDelete('CASCADE')

      table.unique(['log_entry_id', 'log_entry_tag_id'])
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
