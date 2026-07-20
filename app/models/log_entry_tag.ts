import { belongsTo } from '@adonisjs/lucid/orm'
import User from '#models/user'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Exploitation from '#models/exploitation'
import { LogEntryTagSchema } from '#database/schema'

export default class LogEntryTag extends LogEntryTagSchema {
  static table = 'log_entry_tags'

  @belongsTo(() => User)
  declare owner: BelongsTo<typeof User>

  @belongsTo(() => Exploitation)
  declare exploitation: BelongsTo<typeof Exploitation>
}
