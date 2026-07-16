import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import { EventLogSchema } from '#database/schema'

/*
  Describes an event log entry in the system. An event log entry records
  significant actions performed by users or the system for auditing purposes.
*/
export default class EventLog extends EventLogSchema {
  static table = 'event_logs'

  /*
    The ID of the user who performed the event. Null if the user is not logged in.
   */
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User> | null
}
