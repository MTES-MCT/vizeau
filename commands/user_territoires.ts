import { args, BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import type Territoire from '#models/territoire'
import UserService, { type TerritoiresChange } from '#services/user_service'

export default class UserTerritoires extends BaseCommand {
  static commandName = 'user:territoires'
  static description =
    'Show, attach or detach the territoires of users, by AAC code or territoire UUID'
  static help = [
    'Without option, prints the territoires of the users:',
    '  {{ binaryName }} user:territoires foo@bar.com',
    'Attach and detach territoires, as comma-separated AAC codes or UUIDs:',
    '  {{ binaryName }} user:territoires foo@bar.com bar@baz.com --add 6034,6035 --remove 570',
    'Replace the whole list of territoires:',
    '  {{ binaryName }} user:territoires foo@bar.com --sync 1915,5521',
    'From a users batch (territoireCodes and territoireIds), attach only, or sync with --sync:',
    '  {{ binaryName }} user:territoires --file users.json [--sync]',
  ]

  static options: CommandOptions = {
    startApp: true,
  }

  @args.spread({ description: 'Emails of the users', required: false })
  declare emails?: string[]

  @flags.string({ description: 'Territoires to attach, comma-separated' })
  declare add?: string

  @flags.string({ description: 'Territoires to detach, comma-separated' })
  declare remove?: string

  @flags.string({
    allowEmptyValue: true,
    description:
      'Exact list of territoires, the others are detached. With --file, no value: the file is the list',
  })
  declare sync?: string

  @flags.string({ description: 'JSON file holding a users batch, instead of emails' })
  declare file?: string

  @flags.boolean({ description: 'Print the changes without writing anything' })
  declare dryRun: boolean

  async run() {
    try {
      const userService = new UserService()
      const changes = await this.readChanges(userService)
      const isShow = !this.file && !this.add && !this.remove && this.sync === undefined
      const dryRun = this.dryRun || isShow
      const results = await userService.updateTerritoires(changes, { dryRun })
      const prefix = this.dryRun ? '[DRY RUN] ' : ''

      for (const { email, userFound, attached, detached, territoires, notFound } of results) {
        if (!userFound) {
          this.logger.error(`${prefix}User "${email}" not found`)
          this.exitCode = 1
          continue
        }

        if (isShow) {
          this.logger.info(`"${email}": ${territoires.length} territoire(s)`)
          for (const territoire of territoires) this.logger.log(`  ${this.label(territoire)}`)
          continue
        }

        this.logger.info(
          `${prefix}"${email}": +${attached.length} -${detached.length}, ${territoires.length} territoire(s)`
        )
        for (const territoire of attached) {
          this.logger.log(`  ${this.colors.green('+')} ${this.label(territoire)}`)
        }
        for (const territoire of detached) {
          this.logger.log(`  ${this.colors.red('-')} ${this.label(territoire)}`)
        }
        if (notFound.length > 0) {
          this.logger.warning(`  Territoires not found: ${notFound.join(', ')}`)
        }
      }

      if (!isShow) {
        const attached = results.reduce((sum, r) => sum + r.attached.length, 0)
        const detached = results.reduce((sum, r) => sum + r.detached.length, 0)
        const verb = this.dryRun ? 'to attach' : 'attached'
        this.logger.success(
          `${prefix}${attached} territoire(s) ${verb}, ${detached} ${this.dryRun ? 'to detach' : 'detached'}`
        )
      }
    } catch (error) {
      this.logger.error(error instanceof Error ? error.message : 'Failed to update territoires')
      this.exitCode = 1
    }
  }

  /**
   * Builds the changes from the emails and the flags, or from the users batch.
   */
  private async readChanges(userService: UserService): Promise<TerritoiresChange[]> {
    const emails = this.emails ?? []

    if (this.file) {
      if (emails.length > 0 || this.add || this.remove) {
        throw new Error('--file cannot be combined with emails, --add or --remove')
      }
      if (this.sync) throw new Error('--sync takes no value with --file: the file is the list')
      const isSync = this.sync !== undefined
      const users = await userService.readUserSeeds(this.file)
      return users.map((user) => {
        const refs = [...(user.territoireCodes ?? []), ...(user.territoireIds ?? [])]
        return isSync ? { email: user.email, sync: refs } : { email: user.email, add: refs }
      })
    }

    if (emails.length === 0) throw new Error('Give at least one email, or --file')
    if (this.sync === undefined) {
      return emails.map((email) => ({
        email,
        add: this.splitList(this.add),
        remove: this.splitList(this.remove),
      }))
    }
    if (this.add || this.remove) {
      throw new Error('--sync cannot be combined with --add or --remove')
    }
    const sync = this.splitList(this.sync)
    if (sync.length === 0) {
      throw new Error('--sync needs the list of territoires, or use --remove to detach them')
    }
    return emails.map((email) => ({ email, sync }))
  }

  private splitList(value?: string): string[] {
    return (value ?? '').split(/[\s,;]+/).filter(Boolean)
  }

  private label(territoire: Territoire): string {
    const inactive = territoire.isActive ? '' : ' (inactive)'
    return `${territoire.code ?? territoire.id} ${territoire.name}${inactive}`
  }
}
