import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { DateTime } from 'luxon'
import ProjectStepDocument from '#models/project_step_document'
import { ProjectService } from '#services/project_service'
import { ProjectStepService } from '#services/project_step_service'
import { ProjectStepDocumentService } from '#services/project_step_document_service'
import {
  completeProjectStepValidator,
  createProjectStepPayloadValidator,
  destroyProjectStepDocumentValidator,
  downloadProjectStepDocumentValidator,
  showProjectStepValidator,
  updateProjectStepPayloadValidator,
} from '#validators/project_step'
import { showProjectValidator } from '#validators/project'
import { ProjectDto } from '../dto/project_dto.js'
import { ProjectStepDto } from '../dto/project_step_dto.js'
import { createErrorFlashMessage, createSuccessFlashMessage } from '../helpers/flash_message.js'
import router from '@adonisjs/core/services/router'

@inject()
export default class ProjectStepsController {
  constructor(
    public projectService: ProjectService,
    public projectStepService: ProjectStepService,
    public projectStepDocumentService: ProjectStepDocumentService
  ) {}

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
}
