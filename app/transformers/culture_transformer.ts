import { BaseTransformer } from '@adonisjs/core/transformers'
import { toISODateTime } from '../helpers/date.js'
import type Culture from '#models/culture'
import CultureGroupTransformer from '#transformers/culture_group_transformer'

export default class CultureTransformer extends BaseTransformer<Culture> {
  toObject() {
    return {
      ...this.pick(this.resource, ['code', 'label', 'groupCode', 'startingYear', 'endingYear']),
      createdAt: toISODateTime(this.resource.createdAt),
      updatedAt: toISODateTime(this.resource.updatedAt),
      cultureGroup: CultureGroupTransformer.transform(this.whenLoaded(this.resource.cultureGroup)),
    }
  }
}
