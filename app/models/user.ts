import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { beforeCreate, manyToMany } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { randomUUID } from 'node:crypto'
import { DbRememberMeTokensProvider } from '@adonisjs/auth/session'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import Territoire from '#models/territoire'
import { UserSchema } from '#database/schema'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(UserSchema, AuthFinder) {
  static table = 'users'
  static rememberMeTokens = DbRememberMeTokensProvider.forModel(User)
  // Disable primary key generation by the DB
  static selfAssignPrimaryKey = true

  // Auto-generate UUID before DB insertion
  @beforeCreate()
  static assignUuid(user: User) {
    user.id = randomUUID()
  }

  @manyToMany(() => Territoire, {
    pivotTable: 'territoire_user_relations',
    pivotTimestamps: true,
  })
  declare territoires: ManyToMany<typeof Territoire>
}
