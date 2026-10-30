import { BaseTransformer } from '@adonisjs/core/transformers'
import { toISODateTime } from '../helpers/date.js'
import type CultureGroup from '#models/culture_group'
import CultureTransformer from '#transformers/culture_transformer'

export default class CultureGroupTransformer extends BaseTransformer<CultureGroup> {
  toObject() {
    return {
      ...this.pick(this.resource, ['code', 'label']),
      createdAt: toISODateTime(this.resource.createdAt),
      updatedAt: toISODateTime(this.resource.updatedAt),
      cultures: CultureTransformer.transform(this.whenLoaded(this.resource.cultures)),
    }
  }
}
