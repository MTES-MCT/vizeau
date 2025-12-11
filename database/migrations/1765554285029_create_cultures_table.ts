import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'cultures'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('code', 3).primary().notNullable()
      table.integer('group_code').references('code').inTable('culture_groups').onDelete('SET NULL')
      table.string('label', 255).notNullable()
      table.integer('starting_year', 4).notNullable()
      table.integer('ending_year', 4)

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
