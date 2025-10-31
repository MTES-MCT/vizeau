import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, beforeCreate, column, hasMany } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { randomUUID } from 'node:crypto'
import { DbRememberMeTokensProvider } from '@adonisjs/auth/session'
import ExploitationTag from '#models/exploitation_tag'
import type { HasMany } from '@adonisjs/lucid/types/relations'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  static table = 'users'
  static rememberMeTokens = DbRememberMeTokensProvider.forModel(User)
  // Disable primary key generation by the DB
  static selfAssignPrimaryKey = true

  @column({ isPrimary: true })
  declare id: string

  // Auto-generate UUID before DB insertion
  @beforeCreate()
  static assignUuid(user: User) {
    user.id = randomUUID()
  }

  @column()
  declare fullName: string | null

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @hasMany(() => ExploitationTag)
  declare exploitationTags: HasMany<typeof ExploitationTag>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
