import Project, { ProjectStatus } from '#models/project'
import type { DateTime } from 'luxon'

export type CreateProjectPayload = {
  name: string
  description?: string | null
  actionType?: string | null
  status?: Project['status']
  closedAt?: DateTime | null
}

export class ProjectService {
  async createProject(payload: CreateProjectPayload, userId: string) {
    return Project.create({
      name: payload.name,
      description: payload.description ?? null,
      actionType: payload.actionType ?? null,
      status: payload.status ?? ProjectStatus.TO_BE_STARTED,
      userId,
    })
  }

  async findOwnedProjectOrFail(projectId: string, userId: string) {
    return Project.query().where('id', projectId).andWhere('userId', userId).firstOrFail()
  }

  async deleteProject(projectId: string, userId: string) {
    const project = await this.findOwnedProjectOrFail(projectId, userId)

    await project.delete()
  }

  async updateProject(projectId: string, userId: string, payload: Partial<CreateProjectPayload>) {
    const project = await this.findOwnedProjectOrFail(projectId, userId)

    project.merge(payload)
    await project.save()

    return project
  }
}
