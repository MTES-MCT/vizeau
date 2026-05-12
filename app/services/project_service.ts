import Project, { ProjectStatus } from '#models/project'
import { ModelAttributes } from '@adonisjs/lucid/types/model'

export class ProjectService {
  async createProject(payload: Partial<ModelAttributes<Project>>, userId: string) {
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

  async updateProject(
    projectId: string,
    userId: string,
    payload: Partial<ModelAttributes<Project>>
  ) {
    const project = await this.findOwnedProjectOrFail(projectId, userId)

    project.merge(payload)
    await project.save()

    return project
  }
}
