import { BaseTransformer } from '@adonisjs/core/transformers'
import { toISODateTime } from '../helpers/date.js'
import type Captage from '#models/captage'
import ProjectTransformer from '#transformers/project_transformer'

export default class CaptageTransformer extends BaseTransformer<Captage> {
  toObject() {
    return {
      ...this.pick(this.resource, [
        'id',
        'code',
        'name',
        'bssCode',
        'commune',
        'type',
        'state',
        'prioritaire',
      ]),
      createdAt: toISODateTime(this.resource.createdAt),
      updatedAt: toISODateTime(this.resource.updatedAt),
      projects: ProjectTransformer.transform(this.whenLoaded(this.resource.projects)),
    }
  }
}
