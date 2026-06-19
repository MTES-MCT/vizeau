import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { DateTime } from 'luxon'
import Parcelle from '#models/parcelle'
import Captage from '#models/captage'
import ProjectStepDocument from '#models/project_step_document'
import { ProjectService } from '#services/project_service'
import { ExploitationService } from '#services/exploitation_service'
import { ProjectStepService } from '#services/project_step_service'
import { ProjectStepDocumentService } from '#services/project_step_document_service'
import env from '#start/env'
import {
  createProjectValidator,
  destroyProjectValidator,
  indexProjectValidator,
  showProjectValidator,
  updateProjectValidator,
} from '#validators/project'
import { ProjectDto } from '../dto/project_dto.js'
import { ExploitationDto } from '../dto/exploitation_dto.js'
import { CaptageDto } from '../dto/captage_dto.js'
import { createErrorFlashMessage, createSuccessFlashMessage } from '../helpers/flash_message.js'
import { ProjectStepDto } from '../dto/project_step_dto.js'
import {
  completeProjectStepValidator,
  createProjectStepPayloadValidator,
  destroyProjectStepDocumentValidator,
  downloadProjectStepDocumentValidator,
  showProjectStepValidator,
  updateProjectStepPayloadValidator,
} from '#validators/project_step'
import router from '@adonisjs/core/services/router'

@inject()
export default class ProjectsController {
  private static readonly INSTALLATIONS_PER_PAGE = 20

  constructor(
    public projectService: ProjectService,
    public exploitationService: ExploitationService,
    public projectStepService: ProjectStepService,
    public projectStepDocumentService: ProjectStepDocumentService
  ) {}

  async index({ auth, inertia, request }: HttpContext) {
    const user = auth.getUserOrFail()
    // Query string params arrive as empty strings for absent values (bodyparser's
    // convertEmptyStringsToNull only applies to POST/PUT/PATCH/DELETE bodies).
    // We convert them to undefined so VineJS .optional() handles them correctly.
    const qs = request.qs()
    const cleanedQs = Object.fromEntries(Object.entries(qs).filter(([_, v]) => v !== ''))
    const input = await request.validateUsing(indexProjectValidator, { data: cleanedQs })

    const page = input.projetsPage ?? 1
    const recherche = input.projetsRecherche
    const statut = input.projetsStatut ?? 'all'
    const typesActionExclusStr = input.projetsTypesActionExclus ?? ''
    const statutsExclusStr = input.projetsStatutsExclus ?? ''
    const yearFrom = input.projetsYearFrom ?? null
    const yearTo = input.projetsYearTo ?? null

    const typesActionExclus = typesActionExclusStr ? typesActionExclusStr.split(',') : []
    const statutsExclus = statutsExclusStr ? statutsExclusStr.split(',') : []

    const result = await this.projectService.listProjects(user.id, {
      recherche,
      statut,
      typesActionExclus,
      statutsExclus,
      yearFrom,
      yearTo,
      page,
    })

    const serializedProjects = ProjectDto.fromPaginator(result.projects)

    return inertia.render('projets/index', {
      projets: serializedProjects.data,
      meta: serializedProjects.meta,
      projetsCount: result.projetsCount,
      availableActionTypes: result.availableActionTypes,
      availableYearRange: result.availableYearRange,
      statusCounts: result.statusCounts,
      queryString: {
        projetsRecherche: recherche ?? '',
        projetsPage: String(page),
        projetsStatut: statut,
        projetsTypesActionExclus: typesActionExclusStr,
        projetsStatutsExclus: statutsExclusStr,
        projetsYearFrom: yearFrom !== null ? String(yearFrom) : '',
        projetsYearTo: yearTo !== null ? String(yearTo) : '',
      },
    })
  }

  async create({ request, inertia, auth }: HttpContext) {
    const user = auth.getUserOrFail()

    const pageInput = request.input('installationsPage') || '1'
    const rechercheInput = request.input('installationsRecherche')
    const showActifOnlyInput = request.input('showActifOnly') || '0'

    const page = Math.max(1, Number.parseInt(pageInput, 10) || 1)
    const recherche = rechercheInput || undefined
    const showActifOnly = showActifOnlyInput === '1'
    let captageQuery = Captage.query()

    if (recherche) {
      captageQuery = captageQuery.where((q) => {
        q.whereILike('code', `%${recherche}%`).orWhereILike('name', `%${recherche}%`)
      })
    }

    if (showActifOnly) {
      captageQuery = captageQuery.where('state', 'ACTIF')
    }

    const totalRow = await captageQuery.clone().count('* as total').first()
    const total = Number(totalRow?.$extras.total ?? 0)
    const lastPage = Math.max(1, Math.ceil(total / ProjectsController.INSTALLATIONS_PER_PAGE))

    const captageRows = await captageQuery
      .orderBy('state', 'asc')
      .orderBy('code', 'asc')
      .limit(ProjectsController.INSTALLATIONS_PER_PAGE)
      .offset((page - 1) * ProjectsController.INSTALLATIONS_PER_PAGE)

    return inertia.render('projets/creation', {
      exploitations: async () => {
        const results = await this.exploitationService
          .getAllActiveExploitations('', user.id)
          .preload('parcelles')
        return ExploitationDto.toJsonArray(results)
      },
      installations: CaptageDto.toFormJsonArray(captageRows),
      installationsMeta: {
        total,
        perPage: ProjectsController.INSTALLATIONS_PER_PAGE,
        currentPage: page,
        lastPage,
      },
      installationsQueryString: {
        installationsRecherche: recherche ?? '',
        installationsPage: String(page),
        showActifOnly: showActifOnlyInput,
      },
      pmtilesUrl: env.get('PMTILES_URL', ''),
    })
  }

  async show({ auth, request, inertia }: HttpContext) {
    const user = auth.getUserOrFail()
    const { params } = await request.validateUsing(showProjectValidator)
    const project = await this.projectService.findOwnedProjectOrFail(params.projectId, user.id)
    await Promise.all([
      project.load('parcelles'),
      project.load('exploitations'),
      project.load('captages'),
      project.load('steps', (query) =>
        query.preload('tags').preload('documents').orderBy('createdAt', 'desc')
      ),
    ])

    return inertia.render('projets/id', {
      projet: ProjectDto.fromModel(project),
    })
  }

  async store({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const {
      parcelles: parcellesInput,
      millesime,
      ...payload
    } = await request.validateUsing(createProjectValidator)

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

    let resolvedParcelleIds: string[] | undefined
    if (parcellesInput?.length && !millesime && parcellesInput.some((p) => !p.year)) {
      createErrorFlashMessage(
        session,
        'Le millésime est requis lorsque des parcelles sans année sont fournies.'
      )
      return response.redirect().back()
    }

    if (parcellesInput?.length) {
      const fallbackYear = millesime ? Number.parseInt(millesime, 10) : undefined
      const normalizedParcelles = parcellesInput.map((p) => ({
        ...p,
        year: p.year ?? fallbackYear,
      }))

      if (normalizedParcelles.some((p) => !p.year)) {
        createErrorFlashMessage(
          session,
          'Le millésime est requis lorsque des parcelles sans année sont fournies.'
        )
        return response.redirect().back()
      }

      const uniqueByYearAndRpg = new Map<string, (typeof normalizedParcelles)[number]>()
      for (const input of normalizedParcelles) {
        uniqueByYearAndRpg.set(`${input.year}:${input.rpgId}`, input)
      }

      const requestedParcelles = Array.from(uniqueByYearAndRpg.values())
      const requestedKeys = new Set(requestedParcelles.map((p) => `${p.year}:${p.rpgId}`))
      const years = Array.from(new Set(requestedParcelles.map((p) => p.year!)))
      const rpgIds = requestedParcelles.map((p) => p.rpgId)

      // Find all existing DB parcelles for requested year/rpg pairs
      const parcelles = await Parcelle.query().whereIn('rpgId', rpgIds).whereIn('year', years)
      const allExistingParcelles = parcelles.filter((p) =>
        requestedKeys.has(`${p.year}:${p.rpgId}`)
      )

      // Among existing ones, find those accessible by the user (no exploitation or user's exploitation)
      const accessibleParcellesQueryResult = await Parcelle.query()
        .whereIn('rpgId', rpgIds)
        .whereIn('year', years)
        .andWhere((query) => {
          query.whereNull('exploitation_id').orWhereHas('exploitation', (exploitationQuery) => {
            exploitationQuery.whereHas('territoires', (territoireQuery) => {
              territoireQuery.whereHas('users', (userQuery) => {
                userQuery.where('users.id', user.id)
              })
            })
          })
        })

      const accessibleParcelles = accessibleParcellesQueryResult.filter((p) =>
        requestedKeys.has(`${p.year}:${p.rpgId}`)
      )

      // If any existing parcelle is inaccessible (exists in DB but not in accessibleParcelles), reject
      const accessibleYearAndRpg = new Set(accessibleParcelles.map((p) => `${p.year}:${p.rpgId}`))
      const hasInaccessible = allExistingParcelles.some(
        (p) => !accessibleYearAndRpg.has(`${p.year}:${p.rpgId}`)
      )
      if (hasInaccessible) {
        createErrorFlashMessage(
          session,
          "Certaines parcelles désignées appartiennent à des exploitations auxquelles vous n'avez pas accès."
        )
        return response.redirect().back()
      }

      // Create standalone parcelles for year/rpg pairs not yet in DB
      const allExistingYearAndRpg = new Set(allExistingParcelles.map((p) => `${p.year}:${p.rpgId}`))
      for (const input of requestedParcelles) {
        const key = `${input.year}:${input.rpgId}`
        if (!allExistingYearAndRpg.has(key)) {
          const newParcelle = await Parcelle.create({
            exploitationId: null,
            year: input.year!,
            rpgId: input.rpgId,
            surface: input.surface ?? null,
            cultureCode: input.cultureCode ?? null,
            centroid: input.centroid ?? null,
          })
          accessibleParcelles.push(newParcelle)
          allExistingYearAndRpg.add(key)
        }
      }

      resolvedParcelleIds = accessibleParcelles.map((p) => p.id)
    }

    if (payload.parcelleIds?.length) {
      const found = await Parcelle.query()
        .whereIn('id', payload.parcelleIds)
        .andWhere((query) => {
          // We want to find parcelles that have no exploitation or that have an exploitation that belongs to the current user
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

    const project = await this.projectService.createProject(
      {
        ...payload,
        parcelleIds: resolvedParcelleIds ?? payload.parcelleIds,
      },
      user.id
    )
    await Promise.all([
      project.load('parcelles'),
      project.load('exploitations'),
      project.load('captages'),
      project.load('steps', (query) =>
        query.preload('tags').preload('documents').orderBy('createdAt', 'desc')
      ),
    ])

    createSuccessFlashMessage(session, `Le projet "${project.name}" a été créé avec succès.`)

    return response.redirect().toPath('/projets')
  }

  async getForEdition({ auth, request, inertia }: HttpContext) {
    const user = auth.getUserOrFail()
    const { params } = await request.validateUsing(showProjectValidator)
    const project = await this.projectService.findOwnedProjectOrFail(params.projectId, user.id)
    await Promise.all([
      project.load('parcelles'),
      project.load('exploitations'),
      project.load('captages'),
    ])

    const pageInput = request.input('installationsPage') || '1'
    const rechercheInput = request.input('installationsRecherche')
    const showActifOnlyInput = request.input('showActifOnly') || '0'

    const page = Math.max(1, Number.parseInt(pageInput, 10) || 1)
    const recherche = rechercheInput || undefined
    const showActifOnly = showActifOnlyInput === '1'
    let captageQuery = Captage.query()

    if (recherche) {
      captageQuery = captageQuery.where((q) => {
        q.whereILike('code', `%${recherche}%`).orWhereILike('name', `%${recherche}%`)
      })
    }

    if (showActifOnly) {
      captageQuery = captageQuery.where('state', 'ACTIF')
    }

    const totalRow = await captageQuery.clone().count('* as total').first()
    const total = Number(totalRow?.$extras.total ?? 0)
    const lastPage = Math.max(1, Math.ceil(total / ProjectsController.INSTALLATIONS_PER_PAGE))

    const captageRows = await captageQuery
      .orderBy('state', 'asc')
      .orderBy('code', 'asc')
      .limit(ProjectsController.INSTALLATIONS_PER_PAGE)
      .offset((page - 1) * ProjectsController.INSTALLATIONS_PER_PAGE)

    return inertia.render('projets/edition', {
      projet: ProjectDto.fromModel(project),
      exploitations: async () => {
        const results = await this.exploitationService
          .getAllActiveExploitations('', user.id)
          .preload('parcelles')
        return ExploitationDto.toJsonArray(results)
      },
      installations: CaptageDto.toFormJsonArray(captageRows),
      installationsMeta: {
        total,
        perPage: ProjectsController.INSTALLATIONS_PER_PAGE,
        currentPage: page,
        lastPage,
      },
      installationsQueryString: {
        installationsRecherche: recherche ?? '',
        installationsPage: String(page),
        showActifOnly: showActifOnlyInput,
      },
      pmtilesUrl: env.get('PMTILES_URL', ''),
    })
  }

  async createStepForm({ auth, request, inertia }: HttpContext) {
    const user = auth.getUserOrFail()
    const { params } = await request.validateUsing(showProjectValidator)
    const project = await this.projectService.findOwnedProjectOrFail(params.projectId, user.id)

    return inertia.render('projets/etapes/creation', {
      projet: ProjectDto.fromModel(project),
      createStepUrl: router.builder().params([project.id]).make('projets.steps.create'),
    })
  }

  async createStep({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const { params } = await request.validateUsing(showProjectValidator)
    const project = await this.projectService.findOwnedProjectOrFail(params.projectId, user.id)

    const data = await request.validateUsing(createProjectStepPayloadValidator)
    const { title, note, date: dateInput, tags } = data

    if (!title && !note && !dateInput) {
      createErrorFlashMessage(session, "Veuillez renseigner au moins un champ pour créer l'étape.")
      return response.redirect().back()
    }

    const createdStep = await this.projectStepService.createStep(
      project,
      {
        title,
        note,
        date: dateInput ? DateTime.fromISO(dateInput) : null,
      },
      tags
    )

    for (const document of request.files('documents') || []) {
      await this.projectStepDocumentService.createDocument(createdStep.id, document)
    }

    createSuccessFlashMessage(session, "L'étape a été créée avec succès.")
    return response.redirect().toRoute('projets.show', { projectId: project.id })
  }

  async getStep({ auth, request, inertia }: HttpContext) {
    const user = auth.getUserOrFail()
    const { params } = await request.validateUsing(showProjectStepValidator)
    const project = await this.projectService.findOwnedProjectOrFail(params.projectId, user.id)

    const step = await this.projectStepService.getStepForProject(params.stepId, project)

    return inertia.render('projets/etapes/id', {
      projet: {
        id: project.id,
        name: project.name,
      },
      step: ProjectStepDto.fromModel(step)!,
      deleteStepUrl: router.builder().params([project.id, step.id]).make('projets.steps.destroy'),
      completeStepUrl: router.builder().params([project.id]).make('projets.steps.complete'),
    })
  }

  async getStepForEdition({ auth, request, inertia }: HttpContext) {
    const user = auth.getUserOrFail()
    const { params } = await request.validateUsing(showProjectStepValidator)

    const project = await this.projectService.findOwnedProjectOrFail(params.projectId, user.id)
    const step = await this.projectStepService.getStepForProject(params.stepId, project)

    return inertia.render('projets/etapes/edition', {
      projet: ProjectDto.fromModel(project),
      step: ProjectStepDto.fromModel(step)!,
      editStepUrl: router.builder().params([project.id, step.id]).make('projets.steps.edit'),
    })
  }

  async editStep({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const { params } = await request.validateUsing(showProjectStepValidator)
    const stepId = params.stepId
    const project = await this.projectService.findOwnedProjectOrFail(params.projectId, user.id)

    const data = await request.validateUsing(updateProjectStepPayloadValidator)
    const { title, note, date: dateInput, tags, removedDocumentIds = [] } = data

    if (!title && !note && !dateInput) {
      createErrorFlashMessage(
        session,
        "Veuillez renseigner au moins un champ pour modifier l'étape."
      )
      return response.redirect().back()
    }

    await this.projectStepService.updateStep(
      stepId,
      project,
      {
        title,
        note,
        date: dateInput ? DateTime.fromISO(dateInput) : null,
      },
      tags
    )

    for (const document of request.files('documents') || []) {
      await this.projectStepDocumentService.createDocument(stepId, document)
    }

    if (removedDocumentIds.length > 0) {
      const documentsToDelete = await ProjectStepDocument.query()
        .where('projectStepId', stepId)
        .whereIn('id', removedDocumentIds)

      for (const document of documentsToDelete) {
        await document.delete()
      }
    }

    createSuccessFlashMessage(session, "L'étape a été modifiée avec succès.")
    return response.redirect().toPath(`/projets/${project.id}`)
  }

  async destroyStep({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const { params } = await request.validateUsing(showProjectStepValidator)
    const stepId = params.stepId
    const project = await this.projectService.findOwnedProjectOrFail(params.projectId, user.id)

    const documents = await ProjectStepDocument.query().where('projectStepId', stepId)
    for (const document of documents) {
      await document.delete()
    }
    await this.projectStepService.deleteStep(stepId, project)

    createSuccessFlashMessage(session, "L'étape a été supprimée.")
    return response.redirect().toPath(`/projets/${project.id}`)
  }

  async downloadStepDocument({ auth, request, response, logger, session, inertia }: HttpContext) {
    const user = auth.getUserOrFail()
    const { params } = await request.validateUsing(downloadProjectStepDocumentValidator)

    try {
      const project = await this.projectService.findOwnedProjectOrFail(params.projectId, user.id)
      await this.projectStepService.getStepForProject(params.stepId, project)

      const document = await ProjectStepDocument.query()
        .where('projectStepId', params.stepId)
        .andWhere('id', params.documentId)
        .first()

      if (!document) {
        logger.error(
          `Document with ID ${params.documentId} not found for user ${user.id} in step ${params.stepId}`
        )
        createErrorFlashMessage(session, 'Impossible de trouver le document.')
        return response.redirect().back()
      }

      const url = await this.projectStepDocumentService.getDocumentUrl(document.s3Key)

      return inertia.location(url)
    } catch (error) {
      logger.error(error, 'Error downloading project step document:')
      createErrorFlashMessage(
        session,
        'Une erreur est survenue lors du téléchargement du document.'
      )
      return response.redirect().back()
    }
  }

  async destroyDocument({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const { params, documentId } = await request.validateUsing(destroyProjectStepDocumentValidator)

    const project = await this.projectService.findOwnedProjectOrFail(params.projectId, user.id)
    await this.projectStepService.getStepForProject(params.stepId, project)

    const document = await ProjectStepDocument.query()
      .where('projectStepId', params.stepId)
      .andWhere('id', documentId)
      .first()

    if (!document) {
      createErrorFlashMessage(session, 'Impossible de trouver le document.')
      return response.redirect().back()
    }

    await document.delete()
    createSuccessFlashMessage(session, 'Le document a été supprimé avec succès.')
    return response.redirect().back()
  }

  async completeStep({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const { params, id } = await request.validateUsing(completeProjectStepValidator)
    const project = await this.projectService.findOwnedProjectOrFail(params.projectId, user.id)

    await this.projectStepService.updateStep(
      id,
      project,
      {
        isValidated: true,
      },
      undefined
    )

    createSuccessFlashMessage(session, "L'étape a été marquée comme effectuée.")
    return response.redirect().toPath(`/projets/${project.id}`)
  }

  async update({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const {
      params,
      parcelles: parcellesInput,
      millesime,
      parcelleIds: parcelleIdsInput,
      exploitationIds,
      captageIds,
      ...payload
    } = await request.validateUsing(updateProjectValidator)

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

    // Si parcellesInput est fourni (même vide), on initialise à [] pour que le service vide la relation.
    // Si parcellesInput est absent (undefined), on laisse undefined pour que le service ne touche pas aux parcelles.
    let resolvedParcelleIds: string[] | undefined = parcellesInput !== undefined ? [] : undefined
    if (parcellesInput?.length && !millesime && parcellesInput.some((p) => !p.year)) {
      createErrorFlashMessage(
        session,
        'Le millésime est requis lorsque des parcelles sans année sont fournies.'
      )
      return response.redirect().back()
    }

    if (parcellesInput?.length) {
      const fallbackYear = millesime ? Number.parseInt(millesime, 10) : undefined
      const normalizedParcelles = parcellesInput.map((p) => ({
        ...p,
        year: p.year ?? fallbackYear,
      }))

      if (normalizedParcelles.some((p) => !p.year)) {
        createErrorFlashMessage(
          session,
          'Le millésime est requis lorsque des parcelles sans année sont fournies.'
        )
        return response.redirect().back()
      }

      const uniqueByYearAndRpg = new Map<string, (typeof normalizedParcelles)[number]>()
      for (const input of normalizedParcelles) {
        uniqueByYearAndRpg.set(`${input.year}:${input.rpgId}`, input)
      }

      const requestedParcelles = Array.from(uniqueByYearAndRpg.values())
      const requestedKeys = new Set(requestedParcelles.map((p) => `${p.year}:${p.rpgId}`))
      const years = Array.from(new Set(requestedParcelles.map((p) => p.year!)))
      const rpgIds = requestedParcelles.map((p) => p.rpgId)

      const allExistingParcellesQueryResult = await Parcelle.query()
        .whereIn('rpgId', rpgIds)
        .whereIn('year', years)
      const allExistingParcelles = allExistingParcellesQueryResult.filter((p) =>
        requestedKeys.has(`${p.year}:${p.rpgId}`)
      )

      const accessibleParcellesQueryResult = await Parcelle.query()
        .whereIn('rpgId', rpgIds)
        .whereIn('year', years)
        .andWhere((query) => {
          query.whereNull('exploitation_id').orWhereHas('exploitation', (exploitationQuery) => {
            exploitationQuery.whereHas('territoires', (territoireQuery) => {
              territoireQuery.whereHas('users', (userQuery) => {
                userQuery.where('users.id', user.id)
              })
            })
          })
        })
      const accessibleParcelles = accessibleParcellesQueryResult.filter((p) =>
        requestedKeys.has(`${p.year}:${p.rpgId}`)
      )

      const accessibleYearAndRpg = new Set(accessibleParcelles.map((p) => `${p.year}:${p.rpgId}`))
      const hasInaccessible = allExistingParcelles.some(
        (p) => !accessibleYearAndRpg.has(`${p.year}:${p.rpgId}`)
      )
      if (hasInaccessible) {
        createErrorFlashMessage(
          session,
          "Certaines parcelles désignées appartiennent à des exploitations auxquelles vous n'avez pas accès."
        )
        return response.redirect().back()
      }

      const allExistingYearAndRpg = new Set(allExistingParcelles.map((p) => `${p.year}:${p.rpgId}`))
      for (const input of requestedParcelles) {
        const key = `${input.year}:${input.rpgId}`
        if (!allExistingYearAndRpg.has(key)) {
          const newParcelle = await Parcelle.create({
            exploitationId: null,
            year: input.year!,
            rpgId: input.rpgId,
            surface: input.surface ?? null,
            cultureCode: input.cultureCode ?? null,
            centroid: input.centroid ?? null,
          })
          accessibleParcelles.push(newParcelle)
          allExistingYearAndRpg.add(key)
        }
      }

      resolvedParcelleIds = accessibleParcelles.map((p) => p.id)
    }

    const parcelleIds = resolvedParcelleIds ?? parcelleIdsInput

    if (parcelleIds !== undefined && parcelleIds.length > 0) {
      const found = await Parcelle.query()
        .whereIn('id', parcelleIds)
        .andWhere((query) => {
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

    await this.projectService.updateProject(params.projectId, user.id, {
      ...payload,
      parcelleIds,
      exploitationIds,
      captageIds,
    })

    createSuccessFlashMessage(session, `Le projet a été modifié avec succès.`)
    return response.redirect().toPath(`/projets/${params.projectId}`)
  }

  async destroy({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const { params } = await request.validateUsing(destroyProjectValidator)

    await this.projectService.deleteProject(params.projectId, user.id)
    createSuccessFlashMessage(session, `Le projet a été supprimé avec succès.`)

    return response.redirect().toPath(`/projets`)
  }
}
