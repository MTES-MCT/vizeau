import { args, BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { TerritoireService } from '#services/territoire_service'

export default class TerritoireCreate extends BaseCommand {
  static commandName = 'territoire:create'
  static description = 'Create a new territoire'

  static options: CommandOptions = {
    startApp: true,
  }

  @args.string({ description: 'Name of the territoire to create' })
  declare name: string

  async run() {
    try {
      const territoire = await new TerritoireService().createTerritoire(this.name)

      this.logger.success(`Territoire "${territoire.name}" created with id "${territoire.id}"`)
    } catch (error) {
      this.logger.error(error instanceof Error ? error.message : 'Failed to create territoire')
      this.exitCode = 1
    }
  }
}
