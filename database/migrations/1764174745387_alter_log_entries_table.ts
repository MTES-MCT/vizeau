import { BaseSchema } from '@adonisjs/lucid/schema'
import LogEntry from '#models/log_entry'

export default class extends BaseSchema {
  protected tableName = LogEntry.table

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.setNullable('notes')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropNullable('notes')
    })
  }
}
