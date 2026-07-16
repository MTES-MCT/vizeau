import { BaseSchema } from '@adonisjs/lucid/schema'

/*
 * Backfills parcelle_comments from the (soon to be removed) parcelles.comment column.
 * Existing comments are attributed to the owner of the exploitation the parcelle belongs to,
 * since there was no per-user authorship before this migration.
 */
export default class extends BaseSchema {
  async up() {
    await this.db.rawQuery(`
      INSERT INTO parcelle_comments (id, parcelle_id, user_id, comment, created_at, updated_at)
      SELECT uuid_generate_v4(), p.id, e.user_id, p.comment, now(), now()
      FROM parcelles p
      INNER JOIN exploitations e ON e.id = p.exploitation_id
      WHERE p.comment IS NOT NULL AND e.user_id IS NOT NULL
    `)
  }

  async down() {
    // Irreversible data migration: comments are left in parcelle_comments.
  }
}
