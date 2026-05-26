import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import Project from '#models/project'
import Parcelle from '#models/parcelle'
import Captage from '#models/captage'
import { ProjectService } from '#services/project_service'
import { ExploitationService } from '#services/exploitation_service'
import {
  createProjectValidator,
  destroyProjectValidator,
  showProjectValidator,
  updateProjectValidator,
} from '#validators/project'
import { ProjectDto } from '../dto/project_dto.js'
import { createErrorFlashMessage } from '../helpers/flash_message.js'

@inject()
export default class ProjectsController {
  constructor(
    public projectService: ProjectService,
    public exploitationService: ExploitationService
  ) {}

  async index({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const projects = await Project.query().where('userId', user.id).orderBy('createdAt', 'desc')

    return response.json({
      data: projects.map(ProjectDto.fromModel),
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

  async store({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(createProjectValidator)

    // We check if the user has authorization to attach these exploitations (same AAC)
    if (payload.exploitationIds?.length) {
      const found = await this.exploitationService
        .queryActiveExploitations(user.id)
        .whereIn('id', payload.exploitationIds)
        .count('* as total')
        .first()

      if (Number(found?.$extras.total) !== payload.exploitationIds.length) {
        createErrorFlashMessage(
          session,
          "Certaines exploitations désignées n'existent pas ou ne vous appartiennent pas."
        )
        return response.redirect().back()
      }
    }

    if (payload.parcelleIds?.length) {
      const found = await Parcelle.query()
        .whereIn('id', payload.parcelleIds)
        .andWhere((query) => {
          // We want to find parcelles that have no exploitation or that have an exploitation that belongs to the currect user
          query.whereNull('exploitation_id').orWhereHas('exploitation', (exploitationQuery) => {
            exploitationQuery.whereHas('territoires', (territoireQuery) => {
              territoireQuery.whereHas('users', (userQuery) => {
                userQuery.where('users.id', user.id)
              })
            })
          })
        })
        .count('* as total')
        .first()
      if (Number(found?.$extras.total) !== payload.parcelleIds.length) {
        createErrorFlashMessage(
          session,
          "Certaines parcelles désignées n'existent pas ou appartiennent à des exploitations auxquelles vous n'avez pas accès."
        )
        return response.redirect().back()
      }
    }

    if (payload.captageIds?.length) {
      const found = await Captage.query()
        .whereIn('id', payload.captageIds)
        .count('* as total')
        .first()
      if (Number(found?.$extras.total) !== payload.captageIds.length) {
        createErrorFlashMessage(session, "Certains captages désignés n'existent pas.")
        return response.redirect().back()
      }
    }

    const project = await this.projectService.createProject(payload, user.id)

    return response.status(201).json({
      data: ProjectDto.fromModel(project),
    })
  }

  async update({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const { params, parcelleIds, exploitationIds, captageIds, ...payload } =
      await request.validateUsing(updateProjectValidator)

    if (exploitationIds !== undefined && exploitationIds.length > 0) {
      const found = await this.exploitationService
        .queryActiveExploitations(user.id)
        .whereIn('id', exploitationIds)
        .count('* as total')
        .first()
      if (Number(found?.$extras.total) !== exploitationIds.length) {
        createErrorFlashMessage(
          session,
          "Certaines exploitations désignées n'existent pas ou ne vous appartiennent pas."
        )
        return response.redirect().back()
      }
    }

    if (parcelleIds !== undefined && parcelleIds.length > 0) {
      const found = await Parcelle.query()
        .whereIn('id', parcelleIds)
        .andWhere((query) => {
          // We want to find parcelles that have no exploitation or that have an exploitation that belongs to the currect user
          query.whereNull('exploitation_id').orWhereHas('exploitation', (exploitationQuery) => {
            exploitationQuery.whereHas('territoires', (territoireQuery) => {
              territoireQuery.whereHas('users', (userQuery) => {
                userQuery.where('users.id', user.id)
              })
            })
          })
        })
        .count('* as total')
        .first()
      if (Number(found?.$extras.total) !== parcelleIds.length) {
        createErrorFlashMessage(
          session,
          "Certaines parcelles désignées n'existent pas ou appartiennent à des exploitations auxquelles vous n'avez pas accès."
        )
        return response.redirect().back()
      }
    }

    if (captageIds !== undefined && captageIds.length > 0) {
      const found = await Captage.query().whereIn('id', captageIds).count('* as total').first()
      if (Number(found?.$extras.total) !== captageIds.length) {
        createErrorFlashMessage(session, "Certains captages désignés n'existent pas.")
        return response.redirect().back()
      }
    }

    const project = await this.projectService.updateProject(params.projectId, user.id, {
      ...payload,
      parcelleIds,
      exploitationIds,
      captageIds,
    })

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
