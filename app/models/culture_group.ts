import { hasMany } from '@adonisjs/lucid/orm'
import Culture from '#models/culture'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import { CultureGroupSchema } from '#database/schema'

export default class CultureGroup extends CultureGroupSchema {
  @hasMany(() => Culture)
  declare cultures: HasMany<typeof Culture>
}
