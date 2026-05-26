import User from '#models/user'
import Territoire from '#models/territoire'
import Env from '#start/env'

export type EnvUserSeeds = Array<{
  email: string
  fullName?: string
  password?: string
  // AAC Codes
  territoireCodes?: string[]
  // Territoire UUIDs
  territoireIds?: string[]
}>

export default class UserService {
  async seedUsersFromEnv(
    extraUsers: Array<{ fullName: string; email: string; password?: string }> = []
  ) {
    const usersToInject: EnvUserSeeds = JSON.parse(Env.get('USERS_TO_SEED') || '[]')

    const normalized = usersToInject.map((user) => ({
      fullName: user.fullName,
      email: user.email.toLowerCase(),
      password: user.password,
    }))

    await User.updateOrCreateMany('email', [...extraUsers, ...normalized])
  }

  // This seeder assigns territoires to users based on the USERS_TO_SEED environment variable.
  // The variable must respect the EnvUserSeeds type.
  // territoireCodes is useful for AACs from the SANDRE national referential, while territoireIds can be used for any existing territoires.
  // If both territoireCodes and territoireIds are present, both are read.
  async assignTerritoiresFromEnv() {
    const usersToSeed: EnvUserSeeds = JSON.parse(Env.get('USERS_TO_SEED') || '[]')

    for (const userData of usersToSeed) {
      const email = userData.email.toLowerCase().trim()

      const user = await User.findBy('email', email)
      if (!user) {
        console.warn(`User "${email}" not found, skipping territoire assignment`)
        continue
      }

      const territoiresIdsToSync = new Set<string>()

      if (userData.territoireCodes && userData.territoireCodes.length > 0) {
        const territoires = await Territoire.query().whereIn('code', userData.territoireCodes)
        const notFound = userData.territoireCodes.filter(
          (c) => !territoires.some((t) => t.code === c)
        )
        if (notFound.length > 0) {
          console.warn(`Territoire codes not found: ${notFound.join(', ')}`)
        }
        for (const territoire of territoires) {
          territoiresIdsToSync.add(territoire.id)
        }
      }

      if (userData.territoireIds && userData.territoireIds.length > 0) {
        const territoires = await Territoire.query().whereIn('id', userData.territoireIds)
        const notFound = userData.territoireIds.filter((c) => !territoires.some((t) => t.id === c))
        if (notFound.length > 0) {
          console.warn(`Territoire ids not found: ${notFound.join(', ')}`)
        }
        for (const territoire of territoires) {
          territoiresIdsToSync.add(territoire.id)
        }
      }

      await user.related('territoires').sync(territoiresIdsToSync.values().toArray(), false)
      console.info(
        `Assigned ${territoiresIdsToSync.size} territoire(s) to "${email}" based on their ids.`
      )
    }
  }
}
