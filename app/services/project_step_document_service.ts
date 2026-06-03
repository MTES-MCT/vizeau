import ProjectStepDocument from '#models/project_step_document'
import {
  BaseDocumentUploadService,
  type MultipartFileLike,
} from '#services/base_document_upload_service'

// Service to store and retrieve project step documents from a distant S3 bucket.
export class ProjectStepDocumentService extends BaseDocumentUploadService {
  /*
   * Get the full S3 path for a given key, by adding the prefix.
   */
  getS3Path(key: string): string {
    return `project-steps-documents/${key}`
  }

  /*
   * Create a new ProjectStepDocument record in the database with the given information.
   */
  public async createDocument(projectStepId: string, document: MultipartFileLike) {
    const fileName = document.clientName || document.fileName || 'document'
    const key = await this.uploadDocument(document)

    try {
      return await ProjectStepDocument.create({
        projectStepId: projectStepId,
        name: fileName,
        sizeInBytes: document.size,
        s3Key: key,
      })
    } catch (error) {
      // If DB creation fails, attempt to delete the uploaded file to avoid orphaned objects
      try {
        await this.deleteDocument(key)
      } catch {
        // Ignore cleanup errors to preserve the original DB error
      }
      throw error
    }
  }
}
