import { BaseSchema } from '@adonisjs/lucid/schema'
import Territoire from '#models/territoire'
import User from '#models/user'

export default class extends BaseSchema {
  protected tableName = 'territoire_user_relations'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table
        .uuid('territoire_id')
        .notNullable()
        .references('id')
        .inTable(Territoire.table)
        .onDelete('CASCADE')
      table.uuid('user_id').notNullable().references('id').inTable(User.table).onDelete('CASCADE')

      table.unique(['territoire_id', 'user_id'])

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
