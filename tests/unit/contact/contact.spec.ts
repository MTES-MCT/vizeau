import { test } from '@japa/runner'
import { ContactFactory } from '#database/factories/contact_factory'
import testUtils from '@adonisjs/core/services/test_utils'

test.group('Contact CRUD', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('I can create a contact', async ({ assert }) => {
    const contact = await ContactFactory.with('exploitation', 1).create()

    assert.exists(contact.id)
  })

  test("I can fetch a contact's exploitation", async ({ assert }) => {
    const contact = await ContactFactory.with('exploitation', 1).create()
    await contact.load('exploitation')

    assert.exists(contact.exploitation)
  })
})
