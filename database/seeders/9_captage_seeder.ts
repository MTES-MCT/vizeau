import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { AacService } from '#services/aac_service'
import Captage from '#models/captage'
import { DuckdbService } from '#services/duckdb_service'

export default class CaptageSeeder extends BaseSeeder {
  public async run() {
    const duckdbService = new DuckdbService()
    const aacService = new AacService(duckdbService)
    const rows = await aacService.getAllCaptagesFromInstallations()

    await Captage.updateOrCreateMany('code', rows)
  }
}
