import { BaseSchema } from '@adonisjs/lucid/schema'
import Exploitation from '#models/exploitation'

export default class extends BaseSchema {
  protected tableName = Exploitation.table

  async up() {
    await this.raw(
      `ALTER TABLE ${this.tableName} DROP CONSTRAINT IF EXISTS exploitations_type_structure_check;`
    )
  }

  async down() {}
}
