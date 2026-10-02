import { BaseTransformer } from '@adonisjs/core/transformers'
import { toISODateTime } from '../helpers/date.js'
import type Parcelle from '#models/parcelle'
import CultureTransformer from '#transformers/culture_transformer'
import ExploitationTransformer from '#transformers/exploitation_transformer'
import ProjectTransformer from '#transformers/project_transformer'

export default class ParcelleTransformer extends BaseTransformer<Parcelle> {
  /*
   * The `comments` relation, when preloaded, must be scoped by the caller to the comment
   * of a single user (typically the current user) so that `comments[0]` is that user's comment.
   * Other users' comments are never exposed.
   */
  toObject() {
    return {
      ...this.pick(this.resource, [
        'id',
        'exploitationId',
        'year',
        'rpgId',
        'cultureCode',
        'centroid',
      ]),
      createdAt: toISODateTime(this.resource.createdAt),
      updatedAt: toISODateTime(this.resource.updatedAt),
      // Numeric column returned as a string by the pg driver
      surface: this.resource.surface !== null ? Number.parseFloat(this.resource.surface) : null,
      exploitation: ExploitationTransformer.transform(this.whenLoaded(this.resource.exploitation)),
      culture: CultureTransformer.transform(this.whenLoaded(this.resource.culture)),
      comment: this.resource.comments?.[0]?.comment ?? null,
      projects: ProjectTransformer.transform(this.whenLoaded(this.resource.projects)),
    }
  }
}
