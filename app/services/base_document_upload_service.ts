import { randomUUID } from 'node:crypto'
import drive from '@adonisjs/drive/services/main'
import path from 'node:path'

export interface MultipartFileLike {
  clientName?: string
  fileName?: string
  size: number
  moveToDisk: (destination: string) => Promise<void>
}

// Base service to store and retrieve documents from a distant S3 bucket.
export abstract class BaseDocumentUploadService {
  /*
   * Generate a unique key for the document.
   * The key will be used as the filename in the S3 bucket. Store it in the DB to retrieve the document later.
   */
  static getKey(filename: string | undefined): string {
    if (!filename) {
      return `${randomUUID()}-document`
    }

    const base = path.basename(filename)
    const lastDotIndex = base.lastIndexOf('.')
    const extension = lastDotIndex > 0 ? filename.slice(lastDotIndex + 1) : ''
    const basename = lastDotIndex > 0 ? filename.slice(0, lastDotIndex) : base

    const safeName = basename
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      // Limit the length of the filename to prevent excessively long keys
      .slice(0, 100)

    const safeExtension = extension
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase()
      .slice(0, 10)

    const finalName = safeName || 'document'
    return safeExtension
      ? `${randomUUID()}-${finalName}.${safeExtension}`
      : `${randomUUID()}-${finalName}`
  }

  /*
   * Get the full S3 path for a given key, by adding the prefix.
   * Must be overridden by subclasses to define their specific S3 prefix.
   * Implementation should look like `return prefix + '/' + key`.
   */
  protected abstract getS3Path(key: string): string

  /*
   * Upload the document to the S3 bucket and return the generated key.
   * See https://docs.adonisjs.com/guides/digging-deeper/drive#usage
   */
  public async uploadDocument(file: MultipartFileLike): Promise<string> {
    const filename = file.clientName || file.fileName || 'document'
    const key = BaseDocumentUploadService.getKey(filename)
    await file.moveToDisk(this.getS3Path(key))
    return key
  }

  /*
   * Delete the document from the S3 bucket using its key.
   */
  public async deleteDocument(fileKey: string): Promise<void> {
    const disk = drive.use()
    await disk.delete(this.getS3Path(fileKey))
  }

  /*
   * Get a signed URL to access the document from the S3 bucket using its key.
   */
  public async getDocumentUrl(fileKey: string): Promise<string> {
    const disk = drive.use()
    return disk.getSignedUrl(this.getS3Path(fileKey))
  }
}
