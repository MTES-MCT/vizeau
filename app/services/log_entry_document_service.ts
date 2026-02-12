import { cuid } from '@adonisjs/core/helpers'
import drive from '@adonisjs/drive/services/main'
import LogEntryDocument from '#models/log_entry_document'

interface MultipartFileLike {
  clientName?: string
  fileName?: string
  size: number
  moveToDisk: (path: string) => Promise<void>
}

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
      return `${cuid()}-document`
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
    return safeExtension ? `${cuid()}-${finalName}.${safeExtension}` : `${cuid()}-${finalName}`
  }

  /*
   * Get the full S3 path for a given key, by adding the prefix.
   */
  static getS3Path(key: string): string {
    return `${LogEntryDocumentService.prefix}${key}`
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
    await disk.put(LogEntryDocumentService.getS3Path(key), file, {
      contentType,
    })
    return key
  }

  /*
   * Delete the document from the S3 bucket using its key.
   */
  public async deleteDocument(fileKey: string): Promise<void> {
    const disk = drive.use()
    await disk.delete(LogEntryDocumentService.getS3Path(fileKey))
  }

  /*
   * Get a signed URL to access the document from the S3 bucket using its key.
   */
  public async getDocumentUrl(fileKey: string): Promise<string> {
    const disk = drive.use()
    return disk.getSignedUrl(LogEntryDocumentService.getS3Path(fileKey))
  }

  /*
   * Create a new LogEntryDocument record in the database with the given information.
   */
  public async createDocument(logEntryId: string, document: MultipartFileLike) {
    const fileName = document.clientName || document.fileName || 'document'
    const key = LogEntryDocumentService.getKey(fileName)
    // Upload to S3
    await document.moveToDisk(LogEntryDocumentService.getS3Path(key))

    return await LogEntryDocument.create({
      logEntryId: logEntryId,
      name: fileName,
      sizeInBytes: document.size,
      s3Key: key,
    })
  }
}
