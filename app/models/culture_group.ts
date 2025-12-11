import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import Culture from '#models/culture'
import type { HasMany } from '@adonisjs/lucid/types/relations'

export default class CultureGroup extends BaseModel {
  @column({ isPrimary: true })
  declare code: number

  @column()
  declare label: string

  @hasMany(() => Culture)
  declare cultures: HasMany<typeof Culture>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
