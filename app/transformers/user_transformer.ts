import { BaseTransformer } from '@adonisjs/core/transformers'
import type User from '#models/user'
import TerritoireTransformer from '#transformers/territoire_transformer'

export default class UserTransformer extends BaseTransformer<User> {
  toObject() {
    return {
      // The password hash must never be exposed
      ...this.pick(this.resource, ['id', 'email', 'fullName']),
      territoires: TerritoireTransformer.transform(this.whenLoaded(this.resource.territoires)),
    }
  }
}
