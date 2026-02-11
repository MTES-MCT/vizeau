import { BaseSchema } from '@adonisjs/lucid/schema'
import LogEntry from '#models/log_entry'

export default class extends BaseSchema {
  protected tableName = LogEntry.table

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.date('date').nullable()
      table.boolean('is_completed').defaultTo(false)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('date')
      table.dropColumn('is_completed')
    })
  }
}
