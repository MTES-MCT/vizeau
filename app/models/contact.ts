import { beforeCreate, belongsTo } from '@adonisjs/lucid/orm'
import Exploitation from '#models/exploitation'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { randomUUID } from 'node:crypto'
import { ContactSchema } from '#database/schema'

export default class Contact extends ContactSchema {
  static table = 'contacts'

  // Disable primary key generation by the DB
  static selfAssignPrimaryKey = true

  @beforeCreate()
  static assignUuid(contact: Contact) {
    contact.id = randomUUID()
  }

  @belongsTo(() => Exploitation)
  declare exploitation: BelongsTo<typeof Exploitation>
}
