import { BaseCommand, args } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import UserService from '#services/user_service'

export default class UserResetPassword extends BaseCommand {
  static commandName = 'user:reset-password'
  static description = 'Reset the password of a user and output the generated password'

  static options: CommandOptions = {
    startApp: true,
  }

  @args.string({ description: 'Email address of the user' })
  declare email: string

  async run() {
    try {
      const newPassword = await new UserService().resetPassword(this.email)
      this.logger.success(`Password reset successfully for "${this.email}"`)
      // Display the generated password directly in stdout so it never ends up in application logs
      this.logger.info(`New password: ${newPassword}`)
    } catch (error) {
      this.logger.error(error instanceof Error ? error.message : 'Failed to reset password')
      this.exitCode = 1
    }
  }
}
