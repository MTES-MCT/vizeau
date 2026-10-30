import { BaseTransformer } from '@adonisjs/core/transformers'
import { toISODateTime } from '../helpers/date.js'
import type ParcelleComment from '#models/parcelle_comment'
import ParcelleTransformer from '#transformers/parcelle_transformer'
import UserTransformer from '#transformers/user_transformer'

export default class ParcelleCommentTransformer extends BaseTransformer<ParcelleComment> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'parcelleId', 'userId', 'comment']),
      createdAt: toISODateTime(this.resource.createdAt),
      updatedAt: toISODateTime(this.resource.updatedAt),
      parcelle: ParcelleTransformer.transform(this.whenLoaded(this.resource.parcelle)),
      user: UserTransformer.transform(this.whenLoaded(this.resource.user)),
    }
  }
}
