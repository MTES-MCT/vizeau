import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'
import Env from '#start/env'

export default class extends BaseSeeder {
  async run() {
    const usersToInject: Array<{
      fullName: string
      email: string
      password: string
      territoireCodes?: string[]
    }> = JSON.parse(Env.get('USERS_TO_SEED') || '[]')

    for (const user of usersToInject) {
      user.email = user.email.toLowerCase()
      delete user.territoireCodes
    }

    await User.updateOrCreateMany(
      'email',
      [
        {
          fullName: 'Jeanne Martin',
          email: process.env.ADMIN_EMAIL,
          password: process.env.ADMIN_PASSWORD,
        },
      ].concat(usersToInject)
    )
  }
}
