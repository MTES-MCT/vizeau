import Project from '#models/project'
import type { ProjectJson } from '../../types/models.js'

export class ProjectDto {
  static fromModel(project: Project): ProjectJson {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      actionType: project.actionType,
      status: project.status,
      closedAt: project.closedAt?.toISO() ?? null,
      createdAt: project.createdAt.toISO(),
      updatedAt: project.updatedAt.toISO(),
    }
  }
}
