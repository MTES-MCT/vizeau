import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Territoire from '#models/territoire'
import User from '#models/user'
import { DuckdbService, getAacFilesS3Driver } from '#services/duckdb_service'
import Env from '#start/env'

// Non-admin test user created by 1_user_seeder outside production, with a few territoires
const TEST_USER = { email: 'test@vizeau.beta.gouv.fr', territoireCodes: ['1', '2', '3'] }

export default class TerritoireSeeder extends BaseSeeder {
  public async run() {
    const rows = await this.fetchTerritoiresFromParquet()

    if (Env.get('DRY_RUN')) {
      await this.previewChanges(rows)
      return
    }

    // Territoires present in the parquet are (re)activated
    const territoires = await Territoire.updateOrCreateMany(
      'code',
      rows.map((r) => ({ ...r, isActive: true }))
    )

    // Territoires that disappeared from the parquet since the last seeding are deactivated
    await this.queryTerritoiresToDeactivate(rows).update({ isActive: false })

    // Assign all territoires to the admin
    const admin = await User.findByOrFail('email', Env.get('ADMIN_EMAIL').toLowerCase())
    await admin.related('territoires').sync(territoires.map((t) => t.id))

    // Outside production, attach a few territoires to the test user, without detaching any
    const testUser = await User.findBy('email', TEST_USER.email)
    if (Env.get('NODE_ENV') !== 'production' && testUser) {
      const testTerritoires = territoires.filter((t) => TEST_USER.territoireCodes.includes(t.code!))
      await testUser.related('territoires').sync(
        testTerritoires.map((t) => t.id),
        false
      )
    }
  }

  private async fetchTerritoiresFromParquet() {
    return new DuckdbService().query<{ code: string; name: string }>(
      'SELECT code, nom as name FROM read_parquet($path) ORDER BY nom',
      { path: `s3://${getAacFilesS3Driver().options.bucket}/aac.parquet` }
    )
  }

  /**
   * Active AAC territoires (with a code) that are no longer in the parquet.
   * Territoires without a code are not managed by this seeder and are left untouched.
   */
  private queryTerritoiresToDeactivate(rows: { code: string; name: string }[]) {
    return Territoire.query()
      .whereNotNull('code')
      .where('isActive', true)
      .whereNotIn(
        'code',
        rows.map((r) => r.code)
      )
  }

  private async previewChanges(rows: { code: string; name: string }[]) {
    // Only load the territoires matching the parquet codes
    const currentTerritoires = await Territoire.query().whereIn(
      'code',
      rows.map((r) => r.code)
    )
    const existing = new Map(currentTerritoires.map((t) => [t.code, t]))

    const toCreate = rows.filter((r) => !existing.has(r.code))
    const toRename = rows
      .filter((r) => existing.has(r.code) && existing.get(r.code)!.name !== r.name)
      .map((r) => ({ code: r.code, from: existing.get(r.code)!.name, to: r.name }))
    const toReactivate = rows.filter((r) => existing.has(r.code) && !existing.get(r.code)!.isActive)
    const territoiresToDeactivate = await this.queryTerritoiresToDeactivate(rows).select(
      'code',
      'name'
    )
    const toDeactivate = territoiresToDeactivate.map((t) => ({ code: t.code, name: t.name }))

    // The admin sync detaches every territoire that is not in the parquet
    const admin = await User.findByOrFail('email', Env.get('ADMIN_EMAIL').toLowerCase())
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
    console.log(`\n[DRY RUN] Territoires to reactivate (${toReactivate.length})`)
    if (toReactivate.length > 0) console.table(toReactivate)
    console.log(`\n[DRY RUN] Territoires to deactivate (${toDeactivate.length})`)
    if (toDeactivate.length > 0) console.table(toDeactivate)
    console.log(
      `\n[DRY RUN] Territoires to detach from admin "${admin.email}" (${toDetach.length})`
    )
    if (toDetach.length > 0) console.table(toDetach)
    console.log(`\n[DRY RUN] Territoires to attach to admin "${admin.email}" (${toAttach.length})`)
    if (toAttach.length > 0) console.table(toAttach)

    const testUser = await User.findBy('email', TEST_USER.email)
    if (Env.get('NODE_ENV') !== 'production' && testUser) {
      const testUserTerritoires = await testUser.related('territoires').query()
      const testUserCodes = new Set(testUserTerritoires.map((t) => t.code))
      const toAttachToTestUser = rows.filter(
        (r) => TEST_USER.territoireCodes.includes(r.code) && !testUserCodes.has(r.code)
      )
      console.log(
        `\n[DRY RUN] Territoires to attach to test user "${testUser.email}" (${toAttachToTestUser.length})`
      )
      if (toAttachToTestUser.length > 0) console.table(toAttachToTestUser)
    }
  }
}
