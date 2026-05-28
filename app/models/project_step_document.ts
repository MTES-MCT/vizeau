import { DateTime } from 'luxon'
import { BaseModel, beforeDelete, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import ProjectStep from '#models/project_step'
import { ProjectStepDocumentService } from '#services/project_step_document_service'

export default class ProjectStepDocument extends BaseModel {
  static table = 'project_step_documents'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare projectStepId: string

  @belongsTo(() => ProjectStep)
  declare projectStep: BelongsTo<typeof ProjectStep>

  @column()
  declare name: string

  @column({ columnName: 's3_key' })
  declare s3Key: string

  @column()
  declare sizeInBytes: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

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
