import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import CultureGroup from '#models/culture_group'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class Culture extends BaseModel {
  @column({ isPrimary: true })
  declare code: string

  @column()
  declare label: string

  @column()
  declare groupCode: string

  @belongsTo(() => CultureGroup, { localKey: 'groupCode', foreignKey: 'code' })
  declare cultureGroup: BelongsTo<typeof CultureGroup>

  @column()
  declare startingYear: number

  @column()
  declare endingYear: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
