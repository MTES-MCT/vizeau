import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import UserService from '#services/user_service'

export default class UserSeed extends BaseCommand {
  static commandName = 'user:seed'
  static description = 'Create the users of a JSON file that do not exist yet'

  static options: CommandOptions = {
    startApp: true,
  }

  @flags.string({ description: 'JSON file holding the users', required: true })
  declare file: string

  @flags.boolean({
    description: 'Also update the existing users, overwriting their password',
  })
  declare resetPasswords: boolean

  @flags.boolean({ description: 'Print the changes without writing anything' })
  declare dryRun: boolean

  async run() {
    try {
      const userService = new UserService()
      const users = await userService.readUserSeeds(this.file)
      const { created, existing } = await userService.seedUsers(users, {
        resetPasswords: this.resetPasswords,
        dryRun: this.dryRun,
      })
      const prefix = this.dryRun ? '[DRY RUN] ' : ''

      this.logger.success(
        `${prefix}${created.length} user(s) ${this.dryRun ? 'to create' : 'created'}`
      )
      for (const email of created) this.logger.info(`${prefix}Create "${email}"`)

      for (const email of existing) {
        this.logger.warning(
          this.resetPasswords
            ? `${prefix}Update "${email}", password reset`
            : `${prefix}Skip "${email}": already exists (use --reset-passwords)`
        )
      }
    } catch (error) {
      this.logger.error(error instanceof Error ? error.message : 'Failed to seed users')
      this.exitCode = 1
    }
  }
}
