import { BaseTransformer } from '@adonisjs/core/transformers'
import { toISODateTime } from '../helpers/date.js'
import type ProjectStepTag from '#models/project_step_tag'
import ProjectStepTransformer from '#transformers/project_step_transformer'
import UserTransformer from '#transformers/user_transformer'

export default class ProjectStepTagTransformer extends BaseTransformer<ProjectStepTag> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'name', 'userId']),
      createdAt: toISODateTime(this.resource.createdAt),
      updatedAt: toISODateTime(this.resource.updatedAt),
      owner: UserTransformer.transform(this.whenLoaded(this.resource.owner)),
      steps: ProjectStepTransformer.transform(this.whenLoaded(this.resource.steps)),
    }
  }
}
