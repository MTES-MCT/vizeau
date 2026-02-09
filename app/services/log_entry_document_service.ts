import drive from '@adonisjs/drive/services/main'
import { randomUUID } from 'node:crypto'

const ALLOWED_CONTENT_TYPES = new Set(['application/pdf'])

// Service to store and retrieve documents from a distant S3 bucket.
export class LogEntryDocumentService {
  static prefix = 'log-entries-documents/'

  /*
   * Generate a unique key for the document using a timestamp and a sanitized filename
   * The key will be used as the filename in the S3 bucket. Store it in the DB to retrieve the document later.
   */
  static getKey(filename: string | undefined): string {
    if (!filename) {
      return `${randomUUID()}-document`
    }

    const lastDotIndex = filename.lastIndexOf('.')
    const extension = lastDotIndex > 0 ? filename.slice(lastDotIndex + 1) : ''
    const basename = lastDotIndex > 0 ? filename.slice(0, lastDotIndex) : filename

    const safeName = basename
      // Delete any path segments to prevent directory traversal
      .replace(/\.\./g, '')
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
   * Upload the document to the S3 bucket and return the generated key.
   * Probably only used in tests, since in controllers we have access to the file.moveToDisk() helper method.
   * See https://docs.adonisjs.com/guides/digging-deeper/drive#usage
   */
  public async uploadDocument(
    file: Buffer,
    filename: string,
    contentType: string
  ): Promise<string> {
    if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
      throw new Error('Type de fichier non autorisé')
    }

    const disk = drive.use()
    const key = LogEntryDocumentService.getKey(filename)
    await disk.put(`${LogEntryDocumentService.prefix}${key}`, file, {
      contentType,
    })
    return key
  }

  /*
   * Delete the document from the S3 bucket using its key.
   */
  public async deleteDocument(fileKey: string): Promise<void> {
    const disk = drive.use()
    await disk.delete(`${LogEntryDocumentService.prefix}${fileKey}`)
  }

  /*
   * Get a signed URL to access the document from the S3 bucket using its key.
   */
  public async getDocumentUrl(fileKey: string): Promise<string> {
    const disk = drive.use()
    return disk.getSignedUrl(`${LogEntryDocumentService.prefix}${fileKey}`)
  }
}
