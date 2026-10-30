import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'
import Env from '#start/env'

// Creates the admin and, outside production, a non-admin test user (7_territoire_seeder attaches
// a few territoires to it, to test the cloisonnement par territoire).
// Existing users are left untouched: use `node ace user:reset-password` to change a password.
// Other users are created with `node ace user:seed --file`.
export default class extends BaseSeeder {
  async run() {
    const users = [
      {
        fullName: 'Jeanne Martin',
        email: Env.get('ADMIN_EMAIL').toLowerCase(),
        password: Env.get('ADMIN_PASSWORD'),
      },
    ]
    if (Env.get('NODE_ENV') !== 'production') {
      users.push({
        fullName: 'Pierre Dupont',
        email: 'test@vizeau.beta.gouv.fr',
        password: 'password',
      })
    }

    const existingUsers = await User.query().whereIn(
      'email',
      users.map((user) => user.email)
    )
    const existingEmails = new Set(existingUsers.map((user) => user.email))
    const newUsers = users.filter((user) => !existingEmails.has(user.email))

    if (Env.get('DRY_RUN')) {
      console.log(`\n[DRY RUN] Users to create (${newUsers.length})`)
      if (newUsers.length > 0) {
        console.table(newUsers.map(({ email, fullName }) => ({ email, fullName })))
      }
      return
    }

    await User.createMany(newUsers)
  }
}
