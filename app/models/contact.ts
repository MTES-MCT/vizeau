import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, belongsTo, column } from '@adonisjs/lucid/orm'
import Exploitation from '#models/exploitation'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { randomUUID } from 'node:crypto'

export default class Contact extends BaseModel {
  static table = 'contacts'

  // Disable primary key generation by the DB
  static selfAssignPrimaryKey = true

  @column({ isPrimary: true })
  declare id: string

  @beforeCreate()
  static assignUuid(contact: Contact) {
    contact.id = randomUUID()
  }

  @column()
  declare exploitationId: string

  @belongsTo(() => Exploitation)
  declare exploitation: BelongsTo<typeof Exploitation>

  @column()
  declare name: string

  @column()
  declare email: string | null

  @column()
  declare phoneNumber: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
