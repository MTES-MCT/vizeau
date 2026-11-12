import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { inertiaApiClient } from '@adonisjs/inertia/plugins/api_client'
import app from '@adonisjs/core/services/app'
import { UserFactory } from '#database/factories/user_factory'
import { ProjectFactory } from '#database/factories/project_factory'
import { ExploitationFactory } from '#database/factories/exploitation_factory'
import { ParcelleFactory } from '#database/factories/parcelle_factory'

test.group('Projects - Show Route', (group) => {
  group.setup(async () => {
    await (inertiaApiClient(app) as () => Promise<void>)()
  })
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test("I can't fetch another user's project", async ({ client }) => {
    const user = await UserFactory.with('territoires', 1).create()
    const project = await ProjectFactory.with('user').create()

    const response = await client
      .get(`projets/${project.id}`)
      .header('Accept', 'application/json')
      .loginAs(user)

    response.assertStatus(404)
  })

  test("I see the exploitation of my project's parcelles", async ({ assert, client }) => {
    const user = await UserFactory.with('territoires', 1).create()
    const project = await ProjectFactory.merge({ userId: user.id }).create()
    const exploitation = await ExploitationFactory.merge({ name: 'Ferme des Tilleuls' }).create()
    const parcelle = await ParcelleFactory.merge({ exploitationId: exploitation.id }).create()
    const standaloneParcelle = await ParcelleFactory.merge({ exploitationId: null }).create()
    await project.related('parcelles').attach([parcelle.id, standaloneParcelle.id])

    const response = await client.get(`projets/${project.id}`).loginAs(user).withInertia()

    response.assertStatus(200)
    const parcelles: { id: string; exploitation?: { name: string } }[] =
      response.body().props.projet.parcelles
    const withExploitation = parcelles.find((p) => p.id === parcelle.id)
    const standalone = parcelles.find((p) => p.id === standaloneParcelle.id)
    assert.equal(withExploitation?.exploitation?.name, 'Ferme des Tilleuls')
    assert.notExists(standalone?.exploitation)
  })
})
