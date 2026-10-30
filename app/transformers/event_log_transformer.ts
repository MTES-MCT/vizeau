import { BaseTransformer } from '@adonisjs/core/transformers'
import { toISODateTime } from '../helpers/date.js'
import type EventLog from '#models/event_log'
import UserTransformer from '#transformers/user_transformer'

export default class EventLogTransformer extends BaseTransformer<EventLog> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'name', 'step', 'version', 'context', 'userId']),
      createdAt: toISODateTime(this.resource.createdAt),
      user: UserTransformer.transform(this.whenLoaded(this.resource.user)),
    }
  }
}
