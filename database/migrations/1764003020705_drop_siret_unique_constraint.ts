import { BaseSchema } from '@adonisjs/lucid/schema'
import Exploitation from '#models/exploitation'

export default class extends BaseSchema {
  protected tableName = Exploitation.table

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropUnique(['siret'])
      table.dropColumn('siren')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.unique(['siret'])
      table.string('siren').nullable()
    })
  }
}
