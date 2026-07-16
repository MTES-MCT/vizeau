import { beforeCreate, belongsTo, column } from '@adonisjs/lucid/orm'
import { randomUUID } from 'node:crypto'
import Parcelle from '#models/parcelle'
import User from '#models/user'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { ParcelleCommentSchema } from '#database/schema'

export default class ParcelleComment extends ParcelleCommentSchema {
  static table = 'parcelle_comments'
  // Disable primary key generation by the DB
  static selfAssignPrimaryKey = true

  @column({ isPrimary: true })
  declare id: string

  // Auto-generate UUID before DB insertion
  @beforeCreate()
  static assignUuid(parcelleComment: ParcelleComment) {
    parcelleComment.id = randomUUID()
  }

  @belongsTo(() => Parcelle)
  declare parcelle: BelongsTo<typeof Parcelle>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
