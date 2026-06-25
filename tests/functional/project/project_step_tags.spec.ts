import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import ProjectStepTag from '#models/project_step_tag'
import { UserFactory } from '#database/factories/user_factory'
import { ProjectStepTagFactory } from '#database/factories/project_step_tag_factory'

test.group('Projects - Step Tags Routes', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  // ============================================================
  // CREATE TAG TESTS
  // ============================================================

  test('I can create a tag for my project steps', async ({ assert, client, route }) => {
    const user = await UserFactory.with('territoires', 1).create()

    const response = await client
      .post(route('projets.steps.tags.create'))
      .loginAs(user)
      .json({ name: 'Mon étiquette' })
      .withCsrfToken()

    response.assertStatus(200)

    const tag = await ProjectStepTag.findByOrFail('name', 'Mon étiquette')
    assert.equal(tag.userId, user.id)
  })

  test('The created tag is associated to the authenticated user', async ({
    assert,
    client,
    route,
  }) => {
    const user = await UserFactory.with('territoires', 1).create()
    const otherUser = await UserFactory.with('territoires', 1).create()

    await client
      .post(route('projets.steps.tags.create'))
      .loginAs(user)
      .json({ name: 'Tag utilisateur' })
      .withCsrfToken()

    const tag = await ProjectStepTag.findByOrFail('name', 'Tag utilisateur')
    assert.equal(tag.userId, user.id)
    assert.notEqual(tag.userId, otherUser.id)
  })

  test("I can't create a tag without a name", async ({ client, route }) => {
    const user = await UserFactory.with('territoires', 1).create()

    const response = await client
      .post(route('projets.steps.tags.create'))
      .header('Accept', 'application/json')
      .loginAs(user)
      .json({})
      .withCsrfToken()

    response.assertStatus(422)
  })

  test("I can't create a tag with a name exceeding 50 characters", async ({ client, route }) => {
    const user = await UserFactory.with('territoires', 1).create()

    const response = await client
      .post(route('projets.steps.tags.create'))
      .header('Accept', 'application/json')
      .loginAs(user)
      .json({ name: 'A'.repeat(51) })
      .withCsrfToken()

    response.assertStatus(422)
  })

  test("I can't create a tag when not authenticated", async ({ client, route }) => {
    const response = await client
      .post(route('projets.steps.tags.create'))
      .json({ name: 'Tag sans auth' })
      .withCsrfToken()

    // Unauthenticated users are redirected to the login page
    response.assertRedirectsTo('/login')
  })

  // ============================================================
  // DESTROY TAG TESTS
  // ============================================================

  test('I can delete a tag I own', async ({ assert, client, route }) => {
    const user = await UserFactory.with('territoires', 1).create()
    const tag = await ProjectStepTagFactory.merge({ userId: user.id }).create()

    const response = await client
      .delete(route('projets.steps.tags.destroy'))
      .loginAs(user)
      .json({ tagId: tag.id })
      .withCsrfToken()

    response.assertStatus(200)

    const deletedTag = await ProjectStepTag.find(tag.id)
    assert.isNull(deletedTag)
  })

  test("I can't delete a tag I don't own", async ({ assert, client, route }) => {
    const user = await UserFactory.with('territoires', 1).create()
    const otherUser = await UserFactory.with('territoires', 1).create()
    const tag = await ProjectStepTagFactory.merge({ userId: otherUser.id }).create()

    const response = await client
      .delete(route('projets.steps.tags.destroy'))
      .loginAs(user)
      .json({ tagId: tag.id })
      .withCsrfToken()

    // The controller catches the error and redirects back (200 on redirect)
    response.assertStatus(200)

    // The tag must still exist
    const existingTag = await ProjectStepTag.find(tag.id)
    assert.isNotNull(existingTag)
  })

  test("I can't delete a tag with an invalid tagId", async ({ client, route }) => {
    const user = await UserFactory.with('territoires', 1).create()

    const response = await client
      .delete(route('projets.steps.tags.destroy'))
      .header('Accept', 'application/json')
      .loginAs(user)
      .json({ tagId: 'not-a-number' })
      .withCsrfToken()

    response.assertStatus(422)
  })

  test("I can't delete a non-existent tag", async ({ client, route }) => {
    const user = await UserFactory.with('territoires', 1).create()

    const response = await client
      .delete(route('projets.steps.tags.destroy'))
      .loginAs(user)
      .json({ tagId: 99999 })
      .withCsrfToken()

    // The controller catches the error and redirects back (200 on redirect)
    response.assertStatus(200)
  })

  test("I can't delete a tag when not authenticated", async ({ client, route }) => {
    const response = await client
      .delete(route('projets.steps.tags.destroy'))
      .json({ tagId: 1 })
      .withCsrfToken()

    // Unauthenticated users are redirected to the login page
    response.assertRedirectsTo('/login')
  })
})
