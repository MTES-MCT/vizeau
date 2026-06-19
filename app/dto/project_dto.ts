import Project from '#models/project'
import { ModelPaginatorContract } from '@adonisjs/lucid/types/model'
import type { CaptageJson, ProjectJson, PaginatedJson } from '../../types/models.js'
import { ParcelleDto } from './parcelle_dto.js'
import { ProjectStepDto } from './project_step_dto.js'
import { ExploitationDto } from './exploitation_dto.js'
import { CaptageDto } from './captage_dto.js'

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
      parcelles: project.parcelles?.map((p) => ParcelleDto.fromModel(p)) ?? [],
      exploitations: project.exploitations?.map((e) => ExploitationDto.fromModel(e)) ?? [],
      captages: project.captages?.map((c): CaptageJson => CaptageDto.fromModel(c)) ?? [],
      steps: ProjectStepDto.toJsonArray(project.steps ?? []),
    }
  }

  static fromPaginator(
    paginatedProjects: ModelPaginatorContract<Project>
  ): PaginatedJson<ProjectJson> {
    // Use Lucid model instances from the paginator so DateTime fields keep .toISO().
    const transformedData = paginatedProjects.all().map(ProjectDto.fromModel)
    return {
      meta: paginatedProjects.getMeta(),
      data: transformedData,
    }
  }

  static toJsonArray(projects: Project[]): ProjectJson[] {
    return projects.map(ProjectDto.fromModel)
  }
}
