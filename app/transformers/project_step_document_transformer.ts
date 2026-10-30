import { BaseTransformer } from '@adonisjs/core/transformers'
import { toISODateTime } from '../helpers/date.js'
import { urlFor } from '@adonisjs/core/services/url_builder'
import type ProjectStepDocument from '#models/project_step_document'
import ProjectStepTransformer from '#transformers/project_step_transformer'

export default class ProjectStepDocumentTransformer extends BaseTransformer<ProjectStepDocument> {
  /*
   * The download route is nested under the project, which is not a column of the document,
   * so the project id must be provided by the caller.
   */
  constructor(
    resource: ProjectStepDocument,
    protected projectId: string
  ) {
    super(resource)
  }

  toObject() {
    return {
      // The S3 key is internal and must not be exposed
      ...this.pick(this.resource, ['id', 'projectStepId', 'name', 'sizeInBytes']),
      createdAt: toISODateTime(this.resource.createdAt),
      updatedAt: toISODateTime(this.resource.updatedAt),
      href: urlFor('projets.steps.documents.download', {
        projectId: this.projectId,
        stepId: this.resource.projectStepId,
        documentId: this.resource.id,
      }),
      projectStep: ProjectStepTransformer.transform(this.whenLoaded(this.resource.projectStep)),
    }
  }
}
