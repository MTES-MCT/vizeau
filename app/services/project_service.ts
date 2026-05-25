import Project, { ProjectStatus } from '#models/project'
import { ModelAttributes } from '@adonisjs/lucid/types/model'

export interface ProjectPayload extends Partial<ModelAttributes<Project>> {
  parcelleIds?: string[]
  exploitationIds?: string[]
  captageIds?: string[]
}

export class ProjectService {
  async createProject(payload: ProjectPayload, userId: string) {
    const project = await Project.create({
      name: payload.name,
      description: payload.description ?? null,
      actionType: payload.actionType ?? null,
      status: payload.status ?? ProjectStatus.TO_BE_STARTED,
      userId,
    })

    if (payload.parcelleIds?.length) {
      await project.related('parcelles').attach(payload.parcelleIds)
    }
    if (payload.exploitationIds?.length) {
      await project.related('exploitations').attach(payload.exploitationIds)
    }
    if (payload.captageIds?.length) {
      await project.related('captages').attach(payload.captageIds)
    }

    return project
  }

  async findOwnedProjectOrFail(projectId: string, userId: string) {
    return Project.query().where('id', projectId).andWhere('userId', userId).firstOrFail()
  }

  async deleteProject(projectId: string, userId: string) {
    const project = await this.findOwnedProjectOrFail(projectId, userId)

    await project.delete()
  }

  async updateProject(projectId: string, userId: string, payload: ProjectPayload) {
    const project = await this.findOwnedProjectOrFail(projectId, userId)
    const { parcelleIds, exploitationIds, captageIds, ...projectPayload } = payload

    project.merge(projectPayload)
    await project.save()

    if (parcelleIds !== undefined) {
      await project.related('parcelles').sync(parcelleIds)
    }
    if (exploitationIds !== undefined) {
      await project.related('exploitations').sync(exploitationIds)
    }
    if (captageIds !== undefined) {
      await project.related('captages').sync(captageIds)
    }

    return project
  }
}
