import { BaseSchema } from '@adonisjs/lucid/schema'
import EventLog from '#models/event_log'

export default class extends BaseSchema {
  protected tableName = EventLog.table

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.string('name')
      table.string('step').nullable()
      table.uuid('user_id').nullable().references('id').inTable('users').onDelete('SET NULL')
      table.jsonb('context').nullable()
      table.integer('version').defaultTo(1)

      table.timestamp('created_at')

      table.index(['created_at'])
      table.index(['user_id', 'created_at'])
      table.index(['name', 'created_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
