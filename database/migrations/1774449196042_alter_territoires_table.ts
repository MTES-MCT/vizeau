import { BaseSchema } from '@adonisjs/lucid/schema'
import Territoire from '#models/territoire'

export default class extends BaseSchema {
  protected tableName = Territoire.table

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('code')
      table.unique(['code'])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropUnique(['code'])
      table.dropColumn('code')
    })
  }
}
