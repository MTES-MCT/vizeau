import { BaseSeeder } from '@adonisjs/lucid/seeders'
import UserService from '#services/user_service'

export default class extends BaseSeeder {
  async run() {
    const userService = new UserService()
    await userService.seedUsersFromEnv([
      {
        fullName: 'Jeanne Martin',
        email: process.env.ADMIN_EMAIL!,
        password: process.env.ADMIN_PASSWORD,
      },
    ])
  }
}
