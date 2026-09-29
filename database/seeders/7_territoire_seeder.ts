import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Territoire from '#models/territoire'
import User from '#models/user'
import { DuckdbService, getAacFilesS3Driver } from '#services/duckdb_service'

export default class TerritoireSeeder extends BaseSeeder {
  public async run() {
    const rows = await this.fetchTerritoiresFromParquet()

    if (process.env.DRY_RUN) {
      await this.previewChanges(rows)
      return
    }

    const territoires = await Territoire.updateOrCreateMany('code', rows)

    // Assign all territoires to the admin
    const admin = await User.findByOrFail('email', process.env.ADMIN_EMAIL)
    await admin.related('territoires').sync(territoires.map((t) => t.id))
  }

  private async fetchTerritoiresFromParquet() {
    return new DuckdbService().query<{ code: string; name: string }>(
      'SELECT code, nom as name FROM read_parquet($path) ORDER BY nom',
      { path: `s3://${getAacFilesS3Driver().options.bucket}/aac.parquet` }
    )
  }

  private async previewChanges(rows: { code: string; name: string }[]) {
    const currentTerritoires = await Territoire.all()
    const existing = new Map(currentTerritoires.map((t) => [t.code, t]))

    const toCreate = rows.filter((r) => !existing.has(r.code))
    const toRename = rows
      .filter((r) => existing.has(r.code) && existing.get(r.code)!.name !== r.name)
      .map((r) => ({ code: r.code, from: existing.get(r.code)!.name, to: r.name }))

    // The admin sync detaches every territoire that is not in the parquet
    const admin = await User.findByOrFail('email', process.env.ADMIN_EMAIL)
    const adminTerritoires = await admin.related('territoires').query()
    const incoming = new Set(rows.map((r) => r.code))
    const adminCodes = new Set(adminTerritoires.map((t) => t.code))

    const toDetach = adminTerritoires
      .filter((t) => !t.code || !incoming.has(t.code))
      .map((t) => ({ code: t.code, name: t.name }))
    const toAttach = rows.filter((r) => !adminCodes.has(r.code))

    console.log(`\n[DRY RUN] Territoires to create (${toCreate.length})`)
    if (toCreate.length > 0) console.table(toCreate)
    console.log(`\n[DRY RUN] Territoires to rename (${toRename.length})`)
    if (toRename.length > 0) console.table(toRename)
    console.log(
      `\n[DRY RUN] Territoires to detach from admin "${admin.email}" (${toDetach.length})`
    )
    if (toDetach.length > 0) console.table(toDetach)
    console.log(`\n[DRY RUN] Territoires to attach to admin "${admin.email}" (${toAttach.length})`)
    if (toAttach.length > 0) console.table(toAttach)
  }
}
