import { BaseTransformer } from '@adonisjs/core/transformers'
import { toISODateTime } from '../helpers/date.js'
import { urlFor } from '@adonisjs/core/services/url_builder'
import type LogEntryDocument from '#models/log_entry_document'
import LogEntryTransformer from '#transformers/log_entry_transformer'

export default class LogEntryDocumentTransformer extends BaseTransformer<LogEntryDocument> {
  toObject() {
    return {
      // The S3 key is internal and must not be exposed
      ...this.pick(this.resource, ['id', 'logEntryId', 'name', 'sizeInBytes']),
      createdAt: toISODateTime(this.resource.createdAt),
      updatedAt: toISODateTime(this.resource.updatedAt),
      href: urlFor('log_entries.downloadDocument', { documentId: this.resource.id }),
      logEntry: LogEntryTransformer.transform(this.whenLoaded(this.resource.logEntry)),
    }
  }
}
