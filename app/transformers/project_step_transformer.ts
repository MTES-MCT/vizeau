import { BaseTransformer } from '@adonisjs/core/transformers'
import { toISODateTime } from '../helpers/date.js'
import type ProjectStep from '#models/project_step'
import ProjectTransformer from '#transformers/project_transformer'
import ProjectStepDocumentTransformer from '#transformers/project_step_document_transformer'
import ProjectStepTagTransformer from '#transformers/project_step_tag_transformer'

export default class ProjectStepTransformer extends BaseTransformer<ProjectStep> {
  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'projectId', 'title', 'note', 'isValidated']),
      createdAt: toISODateTime(this.resource.createdAt),
      updatedAt: toISODateTime(this.resource.updatedAt),
      // Date-only column: serialize without the time part
      date: this.resource.date?.toISODate() ?? null,
      project: ProjectTransformer.transform(this.whenLoaded(this.resource.project)),
      tags: ProjectStepTagTransformer.transform(this.whenLoaded(this.resource.tags)),
      documents: ProjectStepDocumentTransformer.transform(
        this.whenLoaded(this.resource.documents),
        this.resource.projectId
      ),
    }
  }
}
