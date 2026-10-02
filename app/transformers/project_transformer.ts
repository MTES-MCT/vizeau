import { BaseTransformer } from '@adonisjs/core/transformers'
import { toISODateTime } from '../helpers/date.js'
import type Project from '#models/project'
import CaptageTransformer from '#transformers/captage_transformer'
import ExploitationTransformer from '#transformers/exploitation_transformer'
import ParcelleTransformer from '#transformers/parcelle_transformer'
import ProjectStepTransformer from '#transformers/project_step_transformer'
import TerritoireTransformer from '#transformers/territoire_transformer'
import UserTransformer from '#transformers/user_transformer'

export default class ProjectTransformer extends BaseTransformer<Project> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'userId', 'name', 'description', 'actionType', 'status']),
      closedAt: toISODateTime(this.resource.closedAt),
      createdAt: toISODateTime(this.resource.createdAt),
      updatedAt: toISODateTime(this.resource.updatedAt),
      user: UserTransformer.transform(this.whenLoaded(this.resource.user)),
      territoires: TerritoireTransformer.transform(this.whenLoaded(this.resource.territoires)),
      parcelles: ParcelleTransformer.transform(this.whenLoaded(this.resource.parcelles)),
      exploitations: ExploitationTransformer.transform(
        this.whenLoaded(this.resource.exploitations)
      ),
      captages: CaptageTransformer.transform(this.whenLoaded(this.resource.captages)),
      steps: ProjectStepTransformer.transform(this.whenLoaded(this.resource.steps)),
    }
  }
}
