import type ProjectStep from '#models/project_step'
import type { ProjectStepJson, ProjectStepDocumentJson } from '../../types/models.js'
import router from '@adonisjs/core/services/router'

export class ProjectStepDto {
  static fromModel(projectStep: ProjectStep | null): ProjectStepJson | null {
    if (!projectStep) {
      return null
    }

    return {
      id: projectStep.id,
      title: projectStep.title,
      note: projectStep.note,
      date: projectStep.date?.toISO() ?? null,
      isValidated: projectStep.isValidated,
      tags:
        projectStep.tags?.map((tag) => ({
          id: tag.id,
          name: tag.name,
        })) ?? [],
      documents:
        projectStep.documents?.map((doc): ProjectStepDocumentJson => ({
          id: doc.id,
          name: doc.name,
          sizeInBytes: doc.sizeInBytes,
          href: router
            .builder()
            .params([projectStep.projectId, projectStep.id, doc.id])
            .make('projets.steps.documents.download'),
        })) ?? [],
      createdAt: projectStep.createdAt!.toISO() as string,
      updatedAt: projectStep.updatedAt!.toISO() as string,
    }
  }

  static toJsonArray(projectSteps: ProjectStep[]): ProjectStepJson[] {
    return projectSteps
      .map((step) => this.fromModel(step))
      .filter((step): step is ProjectStepJson => step !== null)
  }
}
