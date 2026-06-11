import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'captages'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('commune').nullable()
      table.string('type').nullable()
      table.boolean('prioritaire').notNullable().defaultTo(false)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('commune')
      table.dropColumn('type')
      table.dropColumn('prioritaire')
    })
  }
}
