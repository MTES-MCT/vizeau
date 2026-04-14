import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'
import Territoire from '#models/territoire'
import Env from '#start/env'

export default class extends BaseSeeder {
  async run() {
    // Read the environment to find territoire codes
    const usersToSeed: Array<{ email: string; territoireCodes?: string[] }> = JSON.parse(
      Env.get('USERS_TO_SEED') || '[]'
    )

    for (const userData of usersToSeed) {
      if (!userData.territoireCodes?.length) continue

      userData.email = userData.email.toLowerCase()

      const user = await User.findBy('email', userData.email)
      if (!user) {
        console.warn(`User "${userData.email}" not found, skipping territoire assignment`)
        continue
      }

      const territoires = await Territoire.query().whereIn('code', userData.territoireCodes)
      const notFound = userData.territoireCodes.filter(
        (c) => !territoires.some((t) => t.code === c)
      )
      if (notFound.length > 0) {
        console.warn(`Territoire codes not found: ${notFound.join(', ')}`)
      }

      await user.related('territoires').sync(
        territoires.map((t) => t.id),
        false
      )
      console.info(`Assigned ${territoires.length} territoire(s) to "${userData.email}"`)
    }
  }
}
