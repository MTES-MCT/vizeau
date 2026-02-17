import { BaseSchema } from '@adonisjs/lucid/schema'
import Parcelle from '#models/parcelle'

export default class extends BaseSchema {
  protected tableName = Parcelle.table

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.point('centroid').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('centroid')
    })
  }
}
