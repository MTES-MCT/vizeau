import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { UserFactory } from '#database/factories/user_factory'
import { ExploitationFactory } from '#database/factories/exploitation_factory'
import { ParcelleFactory } from '#database/factories/parcelle_factory'
import Exploitation from '#models/exploitation'

test.group('Visualisation - Assign parcelles to an exploitation', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('I can assign parcelles to an exploitation', async ({ assert, client }) => {
    const user = await UserFactory.with('territoires', 1).create()
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
      .post('visualisation/parcelles')
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

    response.assertRedirectsTo('/')
  })

  test('I cannot assign a parcelle already assigned to another exploitation', async ({
    assert,
    client,
  }) => {
    const user = await UserFactory.with('territoires', 1).create()
    const exploitation = await ExploitationFactory.create()
    const otherExploitation = await ExploitationFactory.create()
    const takenParcelle = await ParcelleFactory.merge({
      exploitationId: otherExploitation.id,
      year: 2024,
      rpgId: '123456789',
    }).create()

    const response = await client
      .post('visualisation/parcelles')
      .loginAs(user)
      .json({
        exploitationId: exploitation.id,
        year: 2024,
        parcelles: [{ rpgId: '987654321' }, { rpgId: takenParcelle.rpgId }],
      })
      .header('Accept', 'application/json')
      .withCsrfToken()
      // Suivre la redirection consommerait le flash avant qu'on puisse le lire.
      .redirects(0)

    response.assertFlashMessage('error', {
      message: 'La parcelle 123456789 est déjà assignée à une autre exploitation.',
      description: undefined,
      context: undefined,
    })

    // La transaction est annulée : ni la parcelle prise ni la parcelle libre ne sont rattachées.
    await takenParcelle.refresh()
    assert.equal(takenParcelle.exploitationId, otherExploitation.id)
    await exploitation.load('parcelles')
    assert.lengthOf(exploitation.parcelles, 0)
  })
})
