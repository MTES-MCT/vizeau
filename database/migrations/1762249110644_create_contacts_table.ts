import { BaseSchema } from '@adonisjs/lucid/schema'
import Contact from '#models/contact'

export default class extends BaseSchema {
  protected tableName = Contact.table

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary()
      table
        .uuid('exploitation_id')
        .references('id')
        .inTable('exploitations')
        .onDelete('CASCADE')
        .notNullable()
      table.string('name').notNullable()
      table.string('email')
      table.string('phone_number')

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
