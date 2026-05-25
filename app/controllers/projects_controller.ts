import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import Project from '#models/project'
import { ProjectService } from '#services/project_service'
import {
  createProjectValidator,
  destroyProjectValidator,
  showProjectValidator,
  updateProjectValidator,
} from '#validators/project'
import { ProjectDto } from '../dto/project_dto.js'

const PER_PAGE = 20

@inject()
export default class ProjectsController {
  constructor(public projectService: ProjectService) {}

  async index({ auth, inertia, request }: HttpContext) {
    const user = auth.getUserOrFail()
    const pageInput = request.input('projetsPage') || '1'
    const recherche = request.input('projetsRecherche') || undefined
    const page = Math.max(1, Number.parseInt(pageInput, 10) || 1)

    const projetsCount = await Project.query()
      .where('userId', user.id)
      .count('* as total')
      .first()
      .then((r) => Number(r?.$extras?.total ?? 0))

    const query = Project.query().where('userId', user.id).orderBy('createdAt', 'desc')
    if (recherche) {
      query.whereILike('name', `%${recherche}%`)
    }
    const projects = await query.paginate(page, PER_PAGE)

    return inertia.render('projets/index', {
      projets: projects.all().map(ProjectDto.fromModel),
      projetsCount,
      meta: {
        total: projects.total,
        perPage: PER_PAGE,
        currentPage: projects.currentPage,
        lastPage: projects.lastPage,
      },
      queryString: {
        projetsRecherche: recherche ?? '',
        projetsPage: String(page),
      },
    })
  }

  async show({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const { params } = await request.validateUsing(showProjectValidator)
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
    const project = await this.projectService.updateProject(params.projectId, user.id, payload)

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
