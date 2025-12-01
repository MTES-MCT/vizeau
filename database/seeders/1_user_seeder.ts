import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'

export default class extends BaseSeeder {
  async run() {
    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
      console.error('Admin e-mail address or password is not defined in the environment variables.')
      process.exit(1)
    }

    await User.updateOrCreateMany('email', [
      {
        fullName: 'Jeanne Martin',
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
      },
      {
        fullName: 'Pierre Dupont',
        email: 'beta@livingdata.co',
        password: 'password',
      },
    ])
  }
}
