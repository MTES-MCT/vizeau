import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import Project from '#models/project'
import { ProjectService } from '#services/project_service'
import {
  createProjectValidator,
  destroyProjectValidator,
  updateProjectValidator,
} from '#validators/project'
import { ProjectDto } from '../dto/project_dto.js'

@inject()
export default class ProjectsController {
  constructor(public projectService: ProjectService) {}

  async index({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const projects = await Project.query().where('userId', user.id).orderBy('createdAt', 'desc')

    return response.json({
      data: projects.map(ProjectDto.fromModel),
    })
  }

  async show({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const project = await this.projectService.findOwnedProjectOrFail(params.projectId, user.id)

    return response.json({
      data: ProjectDto.fromModel(project),
    })
  }

  async store({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(createProjectValidator)
    const project = await this.projectService.createProject(payload, user.id)

    return response.status(201).json({
      data: ProjectDto.fromModel(project),
    })
  }

  async update({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { params, ...payload } = await request.validateUsing(updateProjectValidator)
    const project = await this.projectService.updateProject(params.projetId, user.id, payload)

    return response.json({
      data: ProjectDto.fromModel(project),
    })
  }

  async destroy({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { params } = await request.validateUsing(destroyProjectValidator)

    await this.projectService.deleteProject(params.projectId, user.id)

    return response.status(204)
  }
}
