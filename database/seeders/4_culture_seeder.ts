import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Culture from '#models/culture'
import { readFileSync } from 'node:fs'
import path from 'node:path'

export default class CultureSeeder extends BaseSeeder {
  public async run() {
    const cultures = JSON.parse(
      readFileSync(path.join('database', 'import_data', 'cultures.json'), 'utf-8')
    )

    for (const item of cultures) {
      const existing = await Culture.findBy('code', item.code)
      if (existing) {
        existing.merge(item)
        await existing.save()
      } else {
        await Culture.create(item)
      }
    }
  }
}
