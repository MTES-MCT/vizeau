import { BaseSeeder } from '@adonisjs/lucid/seeders'
import UserService from '#services/user_service'

export default class extends BaseSeeder {
  async run() {
    const userService = new UserService()
    await userService.assignTerritoiresFromEnv()
  }
}
