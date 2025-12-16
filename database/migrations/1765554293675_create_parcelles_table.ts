import { BaseSchema } from '@adonisjs/lucid/schema'
import Parcelle from '#models/parcelle'
import Exploitation from '#models/exploitation'

export default class extends BaseSchema {
  protected tableName = Parcelle.table

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().notNullable()

      table
        .uuid('exploitation_id')
        .references('id')
        .inTable(Exploitation.table)
        .onDelete('SET NULL')

      table.integer('year', 4).notNullable()
      // id_parcel from RPG. Will be used to link with RPG data
      table.string('rpg_id', 10).index()

      // surface in hectares, surf_parc in RPG
      table.decimal('surface', 8, 2).nullable()
      table
        .string('culture_code', 3)
        .references('code')
        .inTable('cultures')
        .onDelete('SET NULL')
        .nullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
