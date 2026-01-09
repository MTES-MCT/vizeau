import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { UserFactory } from '#database/factories/user_factory'
import { ExploitationFactory } from '#database/factories/exploitation_factory'
import Exploitation from '#models/exploitation'

test.group('Visualisation - Assign parcelles to an exploitation', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('I can assign parcelles to an exploitation', async ({ assert, client, route }) => {
    const user = await UserFactory.create()
    const fakeExploitation = await ExploitationFactory.create()
    const exploitationPayload = {
      exploitationId: fakeExploitation.id,
      year: 2024,
      parcelles: [
        { rpgId: '123456789', surface: 1.5 },
        { rpgId: '987654321', surface: 2.0 },
      ],
    }

    const response = await client
      .post(route('visualisation.assignParcellesToExploitation'))
      .loginAs(user)
      .json(exploitationPayload)
      .header('Accept', 'application/json')
      .withCsrfToken()

    const savedExploitation = await Exploitation.findOrFail(fakeExploitation.id)
    await savedExploitation.load('parcelles')

    for (const parcellePayload of exploitationPayload.parcelles) {
      const matchingParcelle = savedExploitation.parcelles.find(
        (parcelle) =>
          parcelle.rpgId === parcellePayload.rpgId && parcelle.year === exploitationPayload.year
      )
      assert.isNotNull(matchingParcelle)
    }

    response.assertRedirectsTo(route('/'))
  })
})
