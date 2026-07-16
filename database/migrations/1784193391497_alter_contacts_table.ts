import { BaseSchema } from '@adonisjs/lucid/schema'
import Contact from '#models/contact'

export default class extends BaseSchema {
  protected tableName = Contact.table

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('is_primary_contact').notNullable().defaultTo(false).alter()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('is_primary_contact').nullable().defaultTo(false).alter()
    })
  }
}
