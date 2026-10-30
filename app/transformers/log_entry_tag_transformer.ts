import { BaseTransformer } from '@adonisjs/core/transformers'
import { toISODateTime } from '../helpers/date.js'
import type LogEntryTag from '#models/log_entry_tag'
import ExploitationTransformer from '#transformers/exploitation_transformer'
import UserTransformer from '#transformers/user_transformer'

export default class LogEntryTagTransformer extends BaseTransformer<LogEntryTag> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'name', 'userId', 'exploitationId']),
      createdAt: toISODateTime(this.resource.createdAt),
      updatedAt: toISODateTime(this.resource.updatedAt),
      owner: UserTransformer.transform(this.whenLoaded(this.resource.owner)),
      exploitation: ExploitationTransformer.transform(this.whenLoaded(this.resource.exploitation)),
    }
  }
}
