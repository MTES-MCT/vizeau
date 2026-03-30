import { args, BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import User from '#models/user'
import Territoire from '#models/territoire'

export default class TerritoireAssign extends BaseCommand {
  static commandName = 'territoire:assign'
  static description = 'Assign a territoire to a user'

  static options: CommandOptions = {
    startApp: true,
  }

  @args.string({ description: 'UUID of the user' })
  declare userId: string

  @args.string({ description: 'UUID of the territoire to assign' })
  declare territoireId: string

  async run() {
    const user = await User.query().where('id', this.userId).preload('territoires').first()
    if (!user) {
      this.logger.error(`User "${this.userId}" not found`)
      this.exitCode = 1
      return
    }

    const territoire = await Territoire.find(this.territoireId)
    if (!territoire) {
      this.logger.error(`Territoire "${this.territoireId}" not found`)
      this.exitCode = 1
      return
    }

    const alreadyAssigned = user.territoires.some((t) => t.id === this.territoireId)
    if (alreadyAssigned) {
      this.logger.info(
        `Territoire "${territoire.name}" already assigned to "${user.email}", nothing to do`
      )
      return
    }

    await user.related('territoires').attach([this.territoireId])
    this.logger.success(`Territoire "${territoire.name}" assigned to "${user.email}"`)
  }
}
