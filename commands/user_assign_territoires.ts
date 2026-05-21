import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import UserService from '#services/user_service'

export default class UserAssignTerritoires extends BaseCommand {
  static commandName = 'user:assign-territoires'
  static description = 'Assign territoires to users from the USERS_TO_SEED environment variable'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    try {
      await new UserService().assignTerritoiresFromEnv()
      this.logger.success('Territoires assigned successfully')
    } catch (error) {
      this.logger.error(error instanceof Error ? error.message : 'Failed to assign territoires')
      this.exitCode = 1
    }
  }
}
