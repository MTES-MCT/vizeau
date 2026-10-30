import { BaseTransformer } from '@adonisjs/core/transformers'
import { toISODateTime } from '../helpers/date.js'
import type LogEntry from '#models/log_entry'
import ExploitationTransformer from '#transformers/exploitation_transformer'
import LogEntryDocumentTransformer from '#transformers/log_entry_document_transformer'
import LogEntryTagTransformer from '#transformers/log_entry_tag_transformer'
import UserTransformer from '#transformers/user_transformer'

export default class LogEntryTransformer extends BaseTransformer<LogEntry> {
  toObject() {
    return {
      ...this.pick(this.resource, [
        'id',
        'userId',
        'exploitationId',
        'title',
        'notes',
        'isCompleted',
      ]),
      createdAt: toISODateTime(this.resource.createdAt),
      updatedAt: toISODateTime(this.resource.updatedAt),
      // Date-only column: serialize without the time part
      date: this.resource.date?.toISODate() ?? null,
      author: UserTransformer.transform(this.whenLoaded(this.resource.author)),
      exploitation: ExploitationTransformer.transform(this.whenLoaded(this.resource.exploitation)),
      tags: LogEntryTagTransformer.transform(this.whenLoaded(this.resource.tags)),
      documents: LogEntryDocumentTransformer.transform(this.whenLoaded(this.resource.documents)),
    }
  }
}
