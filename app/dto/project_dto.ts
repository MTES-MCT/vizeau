import Project from '#models/project'
import type { ProjectJson, PaginatedJson } from '../../types/models.js'
import { ModelPaginatorContract } from '@adonisjs/lucid/types/model'

export class ProjectDto {
  static fromModel(project: Project): ProjectJson {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      actionType: project.actionType,
      status: project.status,
      closedAt: project.closedAt?.toISO() ?? null,
      createdAt: project.createdAt.toISO() as string,
      updatedAt: project.updatedAt.toISO() as string,
    }
  }

  static fromPaginator(
    paginatedProjects: ModelPaginatorContract<Project>
  ): PaginatedJson<ProjectJson> {
    const transformedData = (paginatedProjects.toJSON().data as Project[]).map(ProjectDto.fromModel)

    return {
      meta: paginatedProjects.getMeta(),
      data: transformedData,
    }
  }

  static toJsonArray(projects: Project[]): ProjectJson[] {
    return projects.map(ProjectDto.fromModel)
  }
}
