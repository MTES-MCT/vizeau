import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'
import Territoire from '#models/territoire'
import Env from '#start/env'

// territoireCodes is useful for AACs from the SANDRE national referential, while territoireIds can be used for any existing territoires.
// If both territoireCodes and territoireIds are present, both are read.
type UserTerritoiresRow = {
  email: string
  // AAC Codes
  territoireCodes?: string[]
  // Territoire UUIDs
  territoireIds?: string[]
}

// Assigns territoires to users based on the USERS_TO_SEED environment variable (JSON array of UserTerritoiresRow).
export default class extends BaseSeeder {
  async run() {
    const usersToSeed: UserTerritoiresRow[] = JSON.parse(Env.get('USERS_TO_SEED') || '[]')
    const toAttach: Array<{ email: string; code: string | null; name: string | null }> = []

    for (const userData of usersToSeed) {
      const email = userData.email.toLowerCase().trim()

      const user = await User.findBy('email', email)
      if (!user) {
        console.warn(`User "${email}" not found, skipping territoire assignment`)
        continue
      }

      const territoireIds = await this.resolveTerritoireIds(userData)

      // The sync doesn't detach, so only new attachments can happen
      if (process.env.DRY_RUN) {
        const currentTerritoires = await user.related('territoires').query().select('id')
        const currentIds = new Set(currentTerritoires.map((t) => t.id))
        const newIds = territoireIds.filter((id) => !currentIds.has(id))
        const territoires = await Territoire.query().whereIn('id', newIds)
        toAttach.push(...territoires.map((t) => ({ email, code: t.code, name: t.name })))
        continue
      }

      await user.related('territoires').sync(territoireIds, false)
      console.info(
        `Assigned ${territoireIds.length} territoire(s) to "${email}" based on their ids.`
      )
    }

    if (process.env.DRY_RUN) {
      console.log(`\n[DRY RUN] Territoires to attach to users (${toAttach.length})`)
      if (toAttach.length > 0) console.table(toAttach)
    }
  }

  private async resolveTerritoireIds(userData: UserTerritoiresRow) {
    const territoireIds = new Set<string>()

    if (userData.territoireCodes && userData.territoireCodes.length > 0) {
      const territoires = await Territoire.query().whereIn('code', userData.territoireCodes)
      const notFound = userData.territoireCodes.filter(
        (c) => !territoires.some((t) => t.code === c)
      )
      if (notFound.length > 0) {
        console.warn(`Territoire codes not found: ${notFound.join(', ')}`)
      }
      for (const territoire of territoires) {
        territoireIds.add(territoire.id)
      }
    }

    if (userData.territoireIds && userData.territoireIds.length > 0) {
      const territoires = await Territoire.query().whereIn('id', userData.territoireIds)
      const notFound = userData.territoireIds.filter((c) => !territoires.some((t) => t.id === c))
      if (notFound.length > 0) {
        console.warn(`Territoire ids not found: ${notFound.join(', ')}`)
      }
      for (const territoire of territoires) {
        territoireIds.add(territoire.id)
      }
    }

    return [...territoireIds]
  }
}
