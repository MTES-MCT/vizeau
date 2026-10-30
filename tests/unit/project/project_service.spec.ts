import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { ProjectService } from '#services/project_service'
import { ProjectStepDocumentService } from '#services/project_step_document_service'
import { ProjectStatus } from '#models/project'
import { UserFactory } from '#database/factories/user_factory'
import { ProjectFactory } from '#database/factories/project_factory'
import { TerritoireFactory } from '#database/factories/territoire_factory'

test.group('ProjectService', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('I can get my own current projects', async ({ assert }) => {
    const user = await UserFactory.create()
    await ProjectFactory.merge({ userId: user.id, status: ProjectStatus.CURRENT }).createMany(2)
    await ProjectFactory.merge({
      userId: user.id,
      status: ProjectStatus.TO_BE_STARTED,
    }).create()

    const service = new ProjectService(new ProjectStepDocumentService())
    const currentProjects = await service.getCurrentProjects(user.id)

    assert.lengthOf(currentProjects, 2)
  })

  test('I get current projects shared with me through a territoire', async ({ assert }) => {
    const user = await UserFactory.create()
    const otherUser = await UserFactory.create()
    const territoire = await TerritoireFactory.create()
    await user.related('territoires').attach([territoire.id])

    const project = await ProjectFactory.merge({
      userId: otherUser.id,
      status: ProjectStatus.CURRENT,
    }).create()
    await project.related('territoires').attach([territoire.id])

    const service = new ProjectService(new ProjectStepDocumentService())
    const currentProjects = await service.getCurrentProjects(user.id)

    assert.lengthOf(currentProjects, 1)
  })

  test("I don't get another user's current projects", async ({ assert }) => {
    const user = await UserFactory.create()
    const otherUser = await UserFactory.create()
    await ProjectFactory.merge({ userId: otherUser.id, status: ProjectStatus.CURRENT }).create()

    const service = new ProjectService(new ProjectStepDocumentService())
    const currentProjects = await service.getCurrentProjects(user.id)

    assert.lengthOf(currentProjects, 0)
  })
})
