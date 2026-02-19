import { test } from '@japa/runner'
import drive from '@adonisjs/drive/services/main'
import fileGenerator from '@poppinss/file-generator'
import { LogEntryDocumentService } from '#services/log_entry_document_service'
import { LogEntryFactory } from '#database/factories/log_entry_factory'

test.group('LogEntryDocumentService', () => {
  test('I can upload a file', async ({ cleanup, assert }) => {
    /*
     * Fake the "spaces" disk and restore the fake
     * after the test finishes
     */
    const fakeDisk = drive.fake('spaces')
    cleanup(() => drive.restore('spaces'))

    /*
     * Generate a fake in-memory PDF file
     */
    const { contents, mime, name } = await fileGenerator.generatePdf('1mb')

    const service = new LogEntryDocumentService()
    const key = await service.uploadDocument(contents, name, mime)

    fakeDisk.assertExists(LogEntryDocumentService.getS3Path(key))

    const url = await service.getDocumentUrl(key)

    assert.isString(url)
  })

  test('I can delete a file', async ({ cleanup }) => {
    const fakeDisk = drive.fake('spaces')
    cleanup(() => drive.restore('spaces'))

    /*
     * Generate a fake in-memory PDF file
     */
    const { contents, mime, name } = await fileGenerator.generatePdf('1mb')

    const service = new LogEntryDocumentService()
    const key = await service.uploadDocument(contents, name, mime)

    await service.deleteDocument(key)

    fakeDisk.assertMissing(LogEntryDocumentService.getS3Path(key))
  })

  test('I can create a document record', async ({ cleanup, assert }) => {
    const fakeDisk = drive.fake('spaces')
    cleanup(() => drive.restore('spaces'))
    const logEntry = await LogEntryFactory.with('author').with('exploitation').create()

    /*
     * Generate a fake in-memory PDF file
     */
    const { contents, name, size } = await fileGenerator.generatePdf('1mb')

    const service = new LogEntryDocumentService()
    const mockInputDocument = {
      clientName: name,
      size: size,
      moveToDisk: async (destination: string) => {
        await fakeDisk.put(destination, contents)
      },
    }

    const document = await service.createDocument(logEntry.id, mockInputDocument)

    assert.equal(document.logEntryId, logEntry.id)
    assert.equal(document.name, name)
    fakeDisk.assertExists(LogEntryDocumentService.getS3Path(document.s3Key))
  })
})
