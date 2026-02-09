import { test } from '@japa/runner'
import drive from '@adonisjs/drive/services/main'
import fileGenerator from '@poppinss/file-generator'
import { LogEntryDocumentService } from '#services/log_entry_document_service'

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

    fakeDisk.assertExists(`${LogEntryDocumentService.prefix}${key}`)

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

    fakeDisk.assertMissing(`${LogEntryDocumentService.prefix}${key}`)
  })
})
