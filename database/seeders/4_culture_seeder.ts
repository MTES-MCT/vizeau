import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Culture from '#models/culture'
import { readFileSync } from 'node:fs'
import path from 'node:path'

export default class CultureSeeder extends BaseSeeder {
  public async run() {
    const cultures = JSON.parse(
      readFileSync(path.join('database', 'data', 'cultures.json'), 'utf-8')
    )

    await Culture.updateOrCreateMany('code', cultures)
  }
}
