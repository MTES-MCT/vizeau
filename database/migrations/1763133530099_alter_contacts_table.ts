import { BaseSchema } from '@adonisjs/lucid/schema'
import Contact from '#models/contact'

export default class extends BaseSchema {
  protected tableName = Contact.table

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.setNullable('name')
      table.renameColumn('name', 'first_name')
      table.string('last_name')
      table.string('role')
      table.boolean('is_primary_contact').defaultTo(false)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.renameColumn('first_name', 'name')
      table.dropNullable('name')
      table.dropColumn('last_name')
      table.dropColumn('role')
      table.dropColumn('is_primary_contact')
    })
  }
}
