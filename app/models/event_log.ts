import { DateTime } from 'luxon'
import { BaseModel, column, hasOne } from '@adonisjs/lucid/orm'
import type { HasOne } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

/*
  Describes an event log entry in the system. An event log entry records
  significant actions performed by users or the system for auditing purposes.
*/
export default class EventLog extends BaseModel {
  static table = 'event_logs'

  @column({ isPrimary: true })
  declare id: number

  /*
    The name of the journey the user is on (e.g., 'exploitation_creation', 'log_entry_update').
   */
  @column()
  declare name: string

  /*
    The name of the step within the journey (e.g., 'start', 'submit_form', 'complete').
   */
  @column()
  declare step: string | null

  /*
    The ID of the user who performed the event. Null if the user is not logged in.
   */
  @hasOne(() => User)
  declare user: HasOne<typeof User> | null

  @column()
  declare userId: string | null

  /*
    Additional context about the event, stored as a JSON object.
   */
  @column()
  declare context: Object | null

  /*
    The version of the journey implementation. Useful later if we want to do A/B testing.
   */
  @column()
  declare version: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
}
