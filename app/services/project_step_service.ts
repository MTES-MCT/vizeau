import { ModelAttributes } from '@adonisjs/lucid/types/model'
import ProjectStep from '#models/project_step'
import ProjectStepDocument from '#models/project_step_document'
import Project from '#models/project'

export class ProjectStepService {
  async createStep(
    project: Project,
    data: Partial<ModelAttributes<ProjectStep>>,
    tagsIds?: number[]
  ) {
    const step = await ProjectStep.create({ ...data, projectId: project.id })

    if (tagsIds && tagsIds.length > 0) {
      await step.related('tags').attach(tagsIds)
    }

    return step
  }

  async getStepsForProject(project: Project) {
    return ProjectStep.query()
      .where('projectId', project.id)
      .preload('tags')
      .preload('documents')
      .orderBy('createdAt', 'desc')
  }

  async updateStep(
    stepId: string,
    project: Project,
    data: Partial<ModelAttributes<ProjectStep>>,
    tagsIds?: number[]
  ) {
    const step = await ProjectStep.query()
      .where('id', stepId)
      .andWhere('projectId', project.id)
      .firstOrFail()

    step.merge(data)
    await step.save()

    if (tagsIds !== undefined) {
      await step.related('tags').sync(tagsIds)
    }

    return step
  }

  async deleteStep(stepId: string, project: Project) {
    const step = await ProjectStep.query()
      .where('id', stepId)
      .andWhere('projectId', project.id)
      .firstOrFail()

    await step.delete()

    return step
  }

  async findDocument(documentId: number, userId: string) {
    return ProjectStepDocument.query()
      .where('id', documentId)
      .andWhereHas('projectStep', (stepQuery) => {
        stepQuery.whereHas('project', (projectQuery) => {
          projectQuery.where('userId', userId)
        })
      })
      .first()
  }
}
