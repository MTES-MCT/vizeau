import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'
import Env from '#start/env'

export default class extends BaseSeeder {
  async run() {
    const usersToInject = JSON.parse(Env.get('USERS_TO_SEED') || '[]')
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
