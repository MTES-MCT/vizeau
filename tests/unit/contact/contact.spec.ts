import { test } from '@japa/runner'
import { ContactFactory } from '#database/factories/contact_factory'
import testUtils from '@adonisjs/core/services/test_utils'
import { ContactJson } from '../../../types/models.js'
import { displayContactName } from '../../../inertia/functions/contacts.js'

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

test.group('Contact front-end functions', () => {
  test('I can display a contact full name', async ({ assert }) => {
    const contact: ContactJson = {
      id: '1',
      firstName: 'Jane',
      lastName: 'Doe',
      role: null,
      email: null,
      phoneNumber: null,
    }

    assert.equal(displayContactName(contact), 'Jane Doe')
  })

  test('I can display a contact first name only', async ({ assert }) => {
    const contact: ContactJson = {
      id: '2',
      firstName: 'Jane',
      lastName: null,
      role: null,
      email: null,
      phoneNumber: null,
    }

    assert.equal(displayContactName(contact), 'Jane')
  })
  test('I can display a contact last name only', async ({ assert }) => {
    const contact: ContactJson = {
      id: '3',
      firstName: null,
      lastName: 'Doe',
      role: null,
      email: null,
      phoneNumber: null,
    }

    assert.equal(displayContactName(contact), 'Doe')
  })

  test('I display N/A when contact has no name', async ({ assert }) => {
    const contact: ContactJson = {
      id: '4',
      firstName: null,
      lastName: null,
      role: null,
      email: null,
      phoneNumber: null,
    }
    assert.equal(displayContactName(contact), 'N/A')
  })

  test('I display N/A when contact is undefined', async ({ assert }) => {
    assert.equal(displayContactName(undefined), 'N/A')
  })
})
