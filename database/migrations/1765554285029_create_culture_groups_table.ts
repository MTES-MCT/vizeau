import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'culture_groups'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.integer('code').primary().notNullable()
      table.string('label', 255).notNullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
