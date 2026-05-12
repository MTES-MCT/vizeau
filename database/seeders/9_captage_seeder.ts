import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { AacService } from '#services/aac_service'
import Captage from '#models/captage'

export default class CaptageSeeder extends BaseSeeder {
  public async run() {
    const aacService = new AacService()
    const rows = await aacService.getAllCaptagesFromInstallations()

    await Captage.updateOrCreateMany('code', rows)
  }
}
