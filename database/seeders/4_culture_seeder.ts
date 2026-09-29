import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Culture from '#models/culture'
import { readFileSync } from 'node:fs'
import path from 'node:path'

type CultureRow = {
  code: string
  label: string
  startingYear: number
  endingYear: number | null
  groupCode: string | null
}

const COMPARED_FIELDS = ['label', 'startingYear', 'endingYear', 'groupCode'] as const

export default class CultureSeeder extends BaseSeeder {
  public async run() {
    const cultures: CultureRow[] = JSON.parse(
      readFileSync(path.join('inertia', 'data', 'cultures.json'), 'utf-8')
    )

    if (process.env.DRY_RUN) {
      await this.previewChanges(cultures)
      return
    }

    await Culture.updateOrCreateMany('code', cultures)
  }

  private async previewChanges(cultures: CultureRow[]) {
    const currentCultures = await Culture.all()
    const existing = new Map(currentCultures.map((c) => [c.code, c]))

    const toCreate = cultures.filter((c) => !existing.has(c.code))
    const toUpdate = cultures.flatMap((culture) => {
      const current = existing.get(culture.code)
      if (!current) return []

      return COMPARED_FIELDS.filter((field) => current[field] !== culture[field]).map((field) => ({
        code: culture.code,
        field,
        from: current[field],
        to: culture[field],
      }))
    })

    console.log(`\n[DRY RUN] Cultures to create (${toCreate.length})`)
    if (toCreate.length > 0) console.table(toCreate)
    console.log(`\n[DRY RUN] Culture fields to update (${toUpdate.length})`)
    if (toUpdate.length > 0) console.table(toUpdate)
  }
}
