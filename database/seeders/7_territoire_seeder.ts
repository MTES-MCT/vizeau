import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { AacService } from '#services/aac_service'
import Territoire from '#models/territoire'
import User from '#models/user'
import { DuckdbService } from '#services/duckdb_service'

export default class TerritoireSeeder extends BaseSeeder {
  public async run() {
    const duckdbService = new DuckdbService()
    const aacService = new AacService(duckdbService)
    const rows = await aacService.getAllNames()

    const territoires = await Territoire.updateOrCreateMany('code', rows)

    // Assign all territoires to the admin
    const admin = await User.findByOrFail('email', process.env.ADMIN_EMAIL)
    await admin.related('territoires').sync(territoires.map((t) => t.id))
  }
}
