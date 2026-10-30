import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import UserService from '#services/user_service'

export default class UserAssignTerritoires extends BaseCommand {
  static commandName = 'user:assign-territoires'
  static description = 'Assign territoires to the users of a JSON file, never detaches'

  static options: CommandOptions = {
    startApp: true,
  }

  @flags.string({ description: 'JSON file holding the users', required: true })
  declare file: string

  @flags.boolean({ description: 'Print the changes without writing anything' })
  declare dryRun: boolean

  async run() {
    try {
      const userService = new UserService()
      const users = await userService.readUserSeeds(this.file)
      const result = await userService.assignTerritoires(users, { dryRun: this.dryRun })
      const prefix = this.dryRun ? '[DRY RUN] ' : ''

      for (const { email, userFound, attached, notFoundCodes, notFoundIds } of result) {
        if (!userFound) {
          this.logger.warning(`${prefix}Skip "${email}": user not found`)
          continue
        }
        this.logger.info(
          `${prefix}${this.dryRun ? 'Attach' : 'Attached'} ${attached} territoire(s) to "${email}"`
        )
        if (notFoundCodes.length > 0) {
          this.logger.warning(`  Territoire codes not found: ${notFoundCodes.join(', ')}`)
        }
        if (notFoundIds.length > 0) {
          this.logger.warning(`  Territoire ids not found: ${notFoundIds.join(', ')}`)
        }
      }

      const total = result.reduce((sum, r) => sum + r.attached, 0)
      this.logger.success(
        `${prefix}${total} territoire(s) ${this.dryRun ? 'to attach' : 'attached'}`
      )
    } catch (error) {
      this.logger.error(error instanceof Error ? error.message : 'Failed to assign territoires')
      this.exitCode = 1
    }
  }
}
