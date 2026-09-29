import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'
import Env from '#start/env'

type UserRow = { fullName?: string; email: string; password?: string }

export default class extends BaseSeeder {
  async run() {
    // USERS_TO_SEED must be a JSON array of { email, fullName?, password? }
    const usersToInject: UserRow[] = JSON.parse(Env.get('USERS_TO_SEED') || '[]')

    const users: UserRow[] = [
      {
        fullName: 'Jeanne Martin',
        email: Env.get('ADMIN_EMAIL')!,
        password: Env.get('ADMIN_PASSWORD'),
      },
      ...usersToInject.map((user) => ({
        fullName: user.fullName,
        email: user.email.toLowerCase(),
        password: user.password,
      })),
    ]

    if (process.env.DRY_RUN) {
      await this.previewChanges(users)
      return
    }

    await User.updateOrCreateMany('email', users)
  }

  // Passwords are hashed in DB, so they can't be compared and are never printed
  private async previewChanges(users: UserRow[]) {
    const currentUsers = await User.all()
    const existing = new Map(currentUsers.map((u) => [u.email, u]))

    const toCreate = users
      .filter((u) => !existing.has(u.email))
      .map((u) => ({ email: u.email, fullName: u.fullName }))
    const toUpdate = users
      .filter((u) => existing.has(u.email) && existing.get(u.email)!.fullName !== u.fullName)
      .map((u) => ({ email: u.email, from: existing.get(u.email)!.fullName, to: u.fullName }))

    console.log(`\n[DRY RUN] Users to create (${toCreate.length})`)
    if (toCreate.length > 0) console.table(toCreate)
    console.log(`\n[DRY RUN] User full names to update (${toUpdate.length})`)
    if (toUpdate.length > 0) console.table(toUpdate)
  }
}
