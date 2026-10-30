import { BaseSchema } from '@adonisjs/lucid/schema'
import Territoire from '#models/territoire'

export default class extends BaseSchema {
  protected tableName = Territoire.table

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('is_active').notNullable().defaultTo(true)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('is_active')
    })
  }
}
