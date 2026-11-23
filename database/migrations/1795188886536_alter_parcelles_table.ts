import { BaseSchema } from '@adonisjs/lucid/schema'
import Parcelle from '#models/parcelle'

/**
 * Passage aux tuiles des parcelles agricoles produites par le projet rpg, à partir du RPG de l'ASP :
 * - `rpg_id` reçoit l'identifiant stable de la parcelle, un entier jusqu'à 2^53 (16 chiffres),
 *   au lieu de l'`id_parcel` du RPG public (10 caractères au plus) ;
 * - `legacy_rpg_id` garde l'ancien identifiant des parcelles migrées par la commande
 *   `parcelles:rpg-id` ;
 * - une parcelle n'est enregistrée qu'une fois par millésime.
 */
export default class extends BaseSchema {
  protected tableName = Parcelle.table

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('rpg_id', 16).alter()
      table.string('legacy_rpg_id', 10).nullable()
      table.unique(['year', 'rpg_id'])
    })
  }

  async down() {
    // Les parcelles migrées retrouvent leur ancien identifiant. Une parcelle enregistrée depuis
    // avec un identifiant stable ne tient pas en 10 caractères : tant qu'il en reste, le retour
    // échoue et il faut les traiter à la main.
    this.defer(async (db) => {
      await db
        .from(this.tableName)
        .whereNotNull('legacy_rpg_id')
        .update({ rpg_id: db.raw('legacy_rpg_id') })
    })
    this.schema.alterTable(this.tableName, (table) => {
      table.dropUnique(['year', 'rpg_id'])
      table.dropColumn('legacy_rpg_id')
      table.string('rpg_id', 10).alter()
    })
  }
}
