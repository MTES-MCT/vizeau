import Project, { ProjectStatus } from '#models/project'
import { ModelAttributes, ModelPaginatorContract } from '@adonisjs/lucid/types/model'
import { DateTime } from 'luxon'
import ProjectStep from '#models/project_step'
import { MultipartFile } from '@adonisjs/core/bodyparser'
import { inject } from '@adonisjs/core'
import { ProjectStepDocumentService } from '#services/project_step_document_service'

export interface ProjectPayload extends Partial<ModelAttributes<Project>> {
  parcelleIds?: string[]
  exploitationIds?: string[]
  captageIds?: string[]
  steps?: Array<{
    title?: string
    notes?: string
    date?: string | null
    tags?: number[]
    documents?: MultipartFile[]
  }>
}

export interface ProjectIndexFilters {
  recherche?: string
  statut: string
  typesActionExclus: string[]
  statutsExclus: string[]
  yearFrom: number | null
  yearTo: number | null
  page: number
}

export interface ProjectIndexResult {
  projects: ModelPaginatorContract<Project>
  projetsCount: number
  availableActionTypes: string[]
  availableYearRange: { min: number; max: number }
  statusCounts: {
    to_be_started: number
    current: number
    completed: number
    abandoned: number
  }
}

const PER_PAGE = 20

@inject()
export class ProjectService {
  constructor(public projectStepDocumentService: ProjectStepDocumentService) {}
  async listProjects(userId: string, filters: ProjectIndexFilters): Promise<ProjectIndexResult> {
    const { recherche, statut, typesActionExclus, statutsExclus, yearFrom, yearTo, page } = filters

    // Total count (unfiltered) — used for the empty-state UI
    const projetsCount = await Project.query()
      .where('userId', userId)
      .count('* as total')
      .first()
      .then((r) => Number(r?.$extras?.total ?? 0))

    // All distinct action types for the user (unfiltered) — stable filter options
    const availableActionTypesRows = await Project.query()
      .where('userId', userId)
      .whereNotNull('actionType')
      .distinct('actionType')
      .select('actionType')
      .orderBy('actionType', 'asc')
    const availableActionTypes = availableActionTypesRows.map((p) => p.actionType as string)

    // Global year range (unfiltered) — bounds for the year slider
    const [oldestProject, newestProject] = await Promise.all([
      Project.query()
        .where('userId', userId)
        .orderBy('createdAt', 'asc')
        .select('createdAt')
        .first(),
      Project.query()
        .where('userId', userId)
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
    const statusCountsQuery = Project.query()
      .where('userId', userId)
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
    const mainQuery = Project.query()
      .where('userId', userId)
      .preload('parcelles')
      .preload('exploitations')
      .preload('captages')
      .orderBy('createdAt', 'desc')
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

    return { projects, projetsCount, availableActionTypes, availableYearRange, statusCounts }
  }

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

    // Create project steps if provided
    if (payload.steps?.length) {
      for (const step of payload.steps) {
        const createdStep = await ProjectStep.create({
          projectId: project.id,
          title: step.title ?? '',
          note: step.notes ?? null,
          date: step.date ? DateTime.fromISO(step.date) : null,
          isValidated: false,
        })
        if (step.tags?.length) {
          await createdStep.related('tags').attach(step.tags)
        }
        if (step.documents?.length) {
          for (const document of step.documents) {
            await this.projectStepDocumentService.createDocument(createdStep.id, document)
          }
        }
      }
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

    // Load relations to ensure they are populated when the DTO is used
    await project.load('parcelles')
    await project.load('exploitations')
    await project.load('captages')
    await project.load('steps')

    return project
  }
}
