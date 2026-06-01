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

const PER_PAGE = 20

@inject()
export default class ProjectsController {
  constructor(
    public projectService: ProjectService,
    public exploitationService: ExploitationService
  ) {}

  async index({ auth, inertia, request }: HttpContext) {
    const user = auth.getUserOrFail()
    const pageInput = request.input('projetsPage') || '1'
    const recherche: string | undefined = request.input('projetsRecherche') || undefined
    const statut: string = request.input('projetsStatut') || 'all'
    const typesActionExclusStr: string = request.input('projetsTypesActionExclus') || ''
    const statutsExclusStr: string = request.input('projetsStatutsExclus') || ''
    const yearFromInput: string | undefined = request.input('projetsYearFrom') || undefined
    const yearToInput: string | undefined = request.input('projetsYearTo') || undefined

    const page = Math.max(1, Number.parseInt(pageInput, 10) || 1)
    const typesActionExclus = typesActionExclusStr ? typesActionExclusStr.split(',') : []
    const statutsExclus = statutsExclusStr ? statutsExclusStr.split(',') : []
    const yearFrom = yearFromInput ? Number.parseInt(yearFromInput, 10) : null
    const yearTo = yearToInput ? Number.parseInt(yearToInput, 10) : null

    // Total count (unfiltered) — used for the empty-state UI
    const projetsCount = await Project.query()
      .where('userId', user.id)
      .count('* as total')
      .first()
      .then((r) => Number(r?.$extras?.total ?? 0))

    // All distinct action types for the user (unfiltered) — stable filter options
    const availableActionTypesRows = await Project.query()
      .where('userId', user.id)
      .whereNotNull('actionType')
      .distinct('actionType')
      .select('actionType')
      .orderBy('actionType', 'asc')
    const availableActionTypes = availableActionTypesRows.map((p) => p.actionType as string)

    // Global year range (unfiltered) — bounds for the year slider
    const [oldestProject, newestProject] = await Promise.all([
      Project.query()
        .where('userId', user.id)
        .orderBy('createdAt', 'asc')
        .select('createdAt')
        .first(),
      Project.query()
        .where('userId', user.id)
        .orderBy('createdAt', 'desc')
        .select('createdAt')
        .first(),
    ])
    const currentYear = new Date().getFullYear()
    const availableYearRange = {
      min: oldestProject?.createdAt.year ?? currentYear,
      max: newestProject?.createdAt.year ?? currentYear,
    }

    // Per-status counts using base filters (search + year + type) but no status filter
    // These power the tab labels so every tab shows its true count given the active filters.
    const statusCountsQuery = Project.query()
      .where('userId', user.id)
      .select('status')
      .groupBy('status')
      .count('* as count')
    if (recherche) statusCountsQuery.whereILike('name', `%${recherche}%`)
    if (yearFrom !== null)
      statusCountsQuery.whereRaw('EXTRACT(YEAR FROM created_at) >= ?', [yearFrom])
    if (yearTo !== null) statusCountsQuery.whereRaw('EXTRACT(YEAR FROM created_at) <= ?', [yearTo])
    if (typesActionExclus.length > 0) {
      statusCountsQuery.where((q) => {
        q.whereNull('actionType').orWhereNotIn('actionType', typesActionExclus)
      })
    }
    const statusCountsRaw = await statusCountsQuery
    const statusCountsMap: Record<string, number> = {}
    for (const row of statusCountsRaw) {
      statusCountsMap[row.status] = Number(row.$extras.count)
    }
    const statusCounts = {
      to_be_started: statusCountsMap['to_be_started'] ?? 0,
      current: statusCountsMap['current'] ?? 0,
      completed: statusCountsMap['completed'] ?? 0,
      abandoned: statusCountsMap['abandoned'] ?? 0,
    }

    // Main paginated query — all filters applied
    const mainQuery = Project.query().where('userId', user.id).orderBy('createdAt', 'desc')
    if (recherche) mainQuery.whereILike('name', `%${recherche}%`)
    if (yearFrom !== null) mainQuery.whereRaw('EXTRACT(YEAR FROM created_at) >= ?', [yearFrom])
    if (yearTo !== null) mainQuery.whereRaw('EXTRACT(YEAR FROM created_at) <= ?', [yearTo])
    if (typesActionExclus.length > 0) {
      mainQuery.where((q) => {
        q.whereNull('actionType').orWhereNotIn('actionType', typesActionExclus)
      })
    }
    if (statut !== 'all') {
      mainQuery.where('status', statut)
    } else if (statutsExclus.length > 0) {
      mainQuery.whereNotIn('status', statutsExclus)
    }
    const projects = await mainQuery.paginate(page, PER_PAGE)
    const serializedProjects = ProjectDto.fromPaginator(projects)

    return inertia.render('projets/index', {
      projets: serializedProjects.data,
      meta: serializedProjects.meta,
      projetsCount,
      availableActionTypes,
      availableYearRange,
      statusCounts,
      queryString: {
        projetsRecherche: recherche ?? '',
        projetsPage: String(page),
        projetsStatut: statut,
        projetsTypesActionExclus: typesActionExclusStr,
        projetsStatutsExclus: statutsExclusStr,
        projetsYearFrom: yearFromInput ?? '',
        projetsYearTo: yearToInput ?? '',
      },
    })
  }

  async show({ auth, request, inertia }: HttpContext) {
    const user = auth.getUserOrFail()
    const { params } = await request.validateUsing(showProjectValidator)
    const project = await this.projectService.findOwnedProjectOrFail(params.projectId, user.id)

    return inertia.render('projets/show', {
      projet: ProjectDto.fromModel(project),
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
