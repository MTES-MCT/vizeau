import { BaseSchema } from '@adonisjs/lucid/schema'
import User from '#models/user'

const ProjectStatus = {
  TO_BE_STARTED: 'to_be_started',
  CURRENT: 'current',
  COMPLETED: 'completed',
  ABANDONED: 'abandoned',
} as const

export default class extends BaseSchema {
  protected tableName = 'projects'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().notNullable()
      table.string('name').notNullable()
      table.text('description').nullable()
      table.text('action_type').nullable()
      table.uuid('user_id').notNullable().references('id').inTable(User.table).onDelete('CASCADE')
      table
        .enum('status', Object.values(ProjectStatus))
        .defaultTo(ProjectStatus.TO_BE_STARTED)
        .notNullable()
      table.timestamp('closed_at').nullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
