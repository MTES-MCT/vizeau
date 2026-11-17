import { BaseSchema } from '@adonisjs/lucid/schema'
import Captage from '#models/captage'

/**
 * Codes BSS des captages, depuis la version de novembre 2026 d'aac.parquet :
 * - `bss_code` (ancien code, par exemple `06992X0035/P1`) peut manquer : il devient nullable ;
 * - le même ancien code peut désigner plusieurs captages (codes SISE-Eaux différents) :
 *   il n'est plus unique, `code` restant l'identifiant du captage ;
 * - `new_bss_code` reçoit le nouveau code BSS (par exemple `BSS001SEGK`), qui peut manquer aussi.
 */
export default class extends BaseSchema {
  protected tableName = Captage.table

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropUnique(['bss_code'])
      table.string('bss_code').nullable().alter()
      table.string('new_bss_code').nullable()
    })
  }

  async down() {
    // Un captage sans ancien code BSS reçoit son code SISE-Eaux, unique. Les captages qui
    // partagent un même ancien code ne sont pas supprimés (des projets peuvent y être liés) :
    // s'il en reste, le rétablissement de la contrainte d'unicité échoue et il faut les traiter à la main.
    this.defer(async (db) => {
      await db
        .from(this.tableName)
        .whereNull('bss_code')
        .update({ bss_code: db.raw('code') })
    })
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('new_bss_code')
      table.string('bss_code').notNullable().alter()
      table.unique(['bss_code'])
    })
  }
}
