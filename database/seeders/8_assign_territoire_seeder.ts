import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'
import Territoire from '#models/territoire'
import Env from '#start/env'

// This seeder assigns territoires to users based on the USERS_TO_SEED environment variable.
// The variable must respect the EnvUserSeeds type.
// territoireCodes is useful for AACs from the SANDRE national referential, while territoireIds can be used for any existing territoires.
// If both territoireCodes and territoireIds are present, both are read.

type EnvUserSeeds = Array<{
  email: string
  // AAC Codes
  territoireCodes?: string[]
  // Territoire UUIDs
  territoireIds?: string[]
}>

export default class extends BaseSeeder {
  async run() {
    // Read the environment to find territoires
    const usersToSeed: EnvUserSeeds = JSON.parse(Env.get('USERS_TO_SEED') || '[]')

    for (const userData of usersToSeed) {
      userData.email = userData.email.toLowerCase().trim()

      const user = await User.findBy('email', userData.email)
      if (!user) {
        console.warn(`User "${userData.email}" not found, skipping territoire assignment`)
        continue
      }

      if (userData.territoireCodes && userData.territoireCodes.length > 0) {
        const territoires = await Territoire.query().whereIn('code', userData.territoireCodes)
        const notFound = userData.territoireCodes.filter(
          (c) => !territoires.some((t) => t.code === c)
        )
        if (notFound.length > 0) {
          console.warn(`Territoire codes not found: ${notFound.join(', ')}`)
        }

        // The sync method ensures the relations are up to date with the env var value
        await user.related('territoires').sync(
          territoires.map((t) => t.id),
          false
        )
        console.info(
          `Assigned ${territoires.length} territoire(s) to "${userData.email}" based on their AAC codes.`
        )
      }
      if (userData.territoireIds && userData.territoireIds.length > 0) {
        const territoires = await Territoire.query().whereIn('id', userData.territoireIds)
        const notFound = userData.territoireIds.filter((c) => !territoires.some((t) => t.id === c))
        if (notFound.length > 0) {
          console.warn(`Territoire ids not found: ${notFound.join(', ')}`)
        }

        // The sync method ensures the relations are up to date with the env var value
        await user.related('territoires').sync(
          territoires.map((t) => t.id),
          false
        )
        console.info(
          `Assigned ${territoires.length} territoire(s) to "${userData.email}" based on their ids.`
        )
      }
    }
  }
}
