import { belongsTo } from '@adonisjs/lucid/orm'
import CultureGroup from '#models/culture_group'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { CultureSchema } from '#database/schema'

export default class Culture extends CultureSchema {
  @belongsTo(() => CultureGroup, { localKey: 'groupCode', foreignKey: 'code' })
  declare cultureGroup: BelongsTo<typeof CultureGroup>
}
