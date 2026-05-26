import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import UserService from '#services/user_service'

export default class UserSeed extends BaseCommand {
  static commandName = 'user:seed'
  static description = 'Create or update users from the USERS_TO_SEED environment variable'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    try {
      await new UserService().seedUsersFromEnv()
      this.logger.success('Users seeded successfully')
    } catch (error) {
      this.logger.error(error instanceof Error ? error.message : 'Failed to seed users')
      this.exitCode = 1
    }
  }
}
