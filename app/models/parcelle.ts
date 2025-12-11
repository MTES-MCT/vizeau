import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, belongsTo, column, hasOne } from '@adonisjs/lucid/orm'
import { randomUUID } from 'node:crypto'
import Exploitation from '#models/exploitation'
import type { BelongsTo, HasOne } from '@adonisjs/lucid/types/relations'
import Culture from '#models/culture'
import CultureGroup from '#models/culture_group'

export default class Parcelle extends BaseModel {
  static table = 'parcelles'
  // Disable primary key generation by the DB
  static selfAssignPrimaryKey = true

  @column({ isPrimary: true })
  declare id: string

  // Stable unique identifier for the parcelle through years
  @column()
  declare parcellePhysiqueId: string

  // Auto-generate UUID before DB insertion
  @beforeCreate()
  static assignUuid(parcelle: Parcelle) {
    parcelle.id = randomUUID()
    if (!parcelle.parcellePhysiqueId) {
      parcelle.parcellePhysiqueId = randomUUID()
    }
  }

  @column()
  declare exploitationId: string | null

  @belongsTo(() => Exploitation)
  declare exploitation: BelongsTo<typeof Exploitation>

  @column()
  declare year: number

  @column()
  declare rpgId: string | null

  @column()
  declare surface: number | null

  @column()
  declare codeCulture: string | null

  @hasOne(() => Culture, { localKey: 'codeCulture', foreignKey: 'code' })
  declare culture: HasOne<typeof Culture>

  @column()
  declare codeGroup: string | null

  @hasOne(() => CultureGroup, { localKey: 'codeGroup', foreignKey: 'code' })
  declare cultureGroup: HasOne<typeof CultureGroup>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
