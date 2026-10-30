import { BaseTransformer } from '@adonisjs/core/transformers'
import { toISODateTime } from '../helpers/date.js'
import type Contact from '#models/contact'
import ExploitationTransformer from '#transformers/exploitation_transformer'

export default class ContactTransformer extends BaseTransformer<Contact> {
  toObject() {
    return {
      ...this.pick(this.resource, [
        'id',
        'exploitationId',
        'firstName',
        'lastName',
        'email',
        'phoneNumber',
        'role',
        'isPrimaryContact',
      ]),
      createdAt: toISODateTime(this.resource.createdAt),
      updatedAt: toISODateTime(this.resource.updatedAt),
      exploitation: ExploitationTransformer.transform(this.whenLoaded(this.resource.exploitation)),
    }
  }
}
