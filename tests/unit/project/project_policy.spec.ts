import { test } from '@japa/runner'
import ProjectPolicy from '#policies/project_policy'
import { UserFactory } from '#database/factories/user_factory'
import { ProjectFactory } from '#database/factories/project_factory'
import { TerritoireFactory } from '#database/factories/territoire_factory'

test.group('ProjectPolicy.write', () => {
  test('returns true if the user is the author of the project', async ({ assert }) => {
    const author = await UserFactory.create()
    const project = await ProjectFactory.merge({ userId: author.id }).create()

    const policy = new ProjectPolicy()
    const result = await policy.readWrite(author, project)
    assert.isTrue(result)
  })

  test('returns true if there is a common territoire among several', async ({ assert }) => {
    const territoire1 = await TerritoireFactory.create()
    const territoire2 = await TerritoireFactory.create()
    const author = await UserFactory.create()
    const otherUser = await UserFactory.create()
    const project = await ProjectFactory.merge({ userId: author.id }).create()

    await otherUser.related('territoires').attach([territoire1.id])
    await project.related('territoires').attach([territoire1.id, territoire2.id])

    const policy = new ProjectPolicy()
    const result = await policy.readWrite(otherUser, project)
    assert.isTrue(result)
  })

  test('returns false if the territoires are disjoint and the user is not the author', async ({
    assert,
  }) => {
    const territoire1 = await TerritoireFactory.create()
    const territoire2 = await TerritoireFactory.create()
    const author = await UserFactory.create()
    const otherUser = await UserFactory.create()
    const project = await ProjectFactory.merge({ userId: author.id }).create()

    await otherUser.related('territoires').attach([territoire1.id])
    await project.related('territoires').attach([territoire2.id])

    const policy = new ProjectPolicy()
    const result = await policy.readWrite(otherUser, project)
    assert.isFalse(result)
  })

  test('returns false if the project has no territoire and the user is not the author', async ({
    assert,
  }) => {
    const author = await UserFactory.create()
    const otherUser = await UserFactory.create()
    const project = await ProjectFactory.merge({ userId: author.id }).create()

    const policy = new ProjectPolicy()
    const result = await policy.readWrite(otherUser, project)
    assert.isFalse(result)
  })
})
