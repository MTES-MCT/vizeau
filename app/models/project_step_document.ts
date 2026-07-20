import { beforeDelete, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import ProjectStep from '#models/project_step'
import { ProjectStepDocumentService } from '#services/project_step_document_service'
import { ProjectStepDocumentSchema } from '#database/schema'

export default class ProjectStepDocument extends ProjectStepDocumentSchema {
  static table = 'project_step_documents'

  @belongsTo(() => ProjectStep)
  declare projectStep: BelongsTo<typeof ProjectStep>

  @column({ columnName: 's3_key' })
  declare s3Key: string

  @beforeDelete()
  static async beforeDeleteHook(document: ProjectStepDocument) {
    const service = new ProjectStepDocumentService()
    try {
      await service.deleteDocument(document.s3Key)
    } catch (error) {
      console.error(`Failed to delete document from S3 with key ${document.s3Key}:`, error)
    }
  }
}
