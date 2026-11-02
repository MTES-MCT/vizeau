import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import hash from '@adonisjs/core/services/hash'
import UserService from '#services/user_service'
import User from '#models/user'
import type Territoire from '#models/territoire'
import { UserFactory } from '#database/factories/user_factory'
import { TerritoireFactory } from '#database/factories/territoire_factory'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

test.group('User service | seedUsers', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('it creates the new users with a lowercased email', async ({ assert }) => {
    const result = await new UserService().seedUsers([
      { email: ' New.User@Example.com ', fullName: 'New User', password: 'new-password' },
    ])

    const user = await User.findByOrFail('email', 'new.user@example.com')
    assert.deepEqual(result, { created: ['new.user@example.com'], existing: [] })
    assert.equal(user.fullName, 'New User')
    assert.isTrue(await hash.verify(user.password, 'new-password'))
  })

  test('it leaves the existing users untouched by default', async ({ assert }) => {
    const existingUser = await UserFactory.merge({
      email: 'existing@example.com',
      fullName: 'Existing User',
    }).create()

    const result = await new UserService().seedUsers([
      { email: 'existing@example.com', fullName: 'Renamed', password: 'other-password' },
      { email: 'new@example.com', password: 'new-password' },
    ])

    await existingUser.refresh()
    assert.deepEqual(result, { created: ['new@example.com'], existing: ['existing@example.com'] })
    assert.equal(existingUser.fullName, 'Existing User')
    assert.isTrue(await hash.verify(existingUser.password, 'password'))
  })

  test('it overwrites the existing users with resetPasswords', async ({ assert }) => {
    const existingUser = await UserFactory.merge({ email: 'existing@example.com' }).create()

    const result = await new UserService().seedUsers(
      [{ email: 'existing@example.com', fullName: 'Renamed', password: 'other-password' }],
      { resetPasswords: true }
    )

    await existingUser.refresh()
    assert.deepEqual(result, { created: [], existing: ['existing@example.com'] })
    assert.equal(existingUser.fullName, 'Renamed')
    assert.isTrue(await hash.verify(existingUser.password, 'other-password'))
  })

  test('it writes nothing with dryRun', async ({ assert }) => {
    const existingUser = await UserFactory.merge({ email: 'existing@example.com' }).create()

    const result = await new UserService().seedUsers(
      [
        { email: 'existing@example.com', fullName: 'Renamed', password: 'other-password' },
        { email: 'new@example.com', password: 'new-password' },
      ],
      { resetPasswords: true, dryRun: true }
    )

    await existingUser.refresh()
    assert.deepEqual(result, { created: ['new@example.com'], existing: ['existing@example.com'] })
    assert.isNull(await User.findBy('email', 'new@example.com'))
    assert.isTrue(await hash.verify(existingUser.password, 'password'))
  })

  test('it rejects the batch when a user to write has no password', async ({ assert }) => {
    await assert.rejects(
      () =>
        new UserService().seedUsers(
          [{ email: 'new@example.com', password: 'new-password' }, { email: 'nopass@example.com' }],
          { dryRun: true }
        ),
      /Missing password for: nopass@example\.com/
    )
    assert.isNull(await User.findBy('email', 'new@example.com'))
  })

  test('it keeps the fullName of an existing user when the batch has none', async ({ assert }) => {
    const existingUser = await UserFactory.merge({
      email: 'existing@example.com',
      fullName: 'Existing User',
    }).create()

    await new UserService().seedUsers(
      [{ email: 'existing@example.com', password: 'other-password' }],
      { resetPasswords: true }
    )

    await existingUser.refresh()
    assert.equal(existingUser.fullName, 'Existing User')
  })

  test('it creates a user only once when its email is duplicated', async ({ assert }) => {
    const result = await new UserService().seedUsers([
      { email: 'dup@example.com', password: 'first' },
      { email: 'DUP@example.com', password: 'second' },
    ])

    const users = await User.query().where('email', 'dup@example.com')
    assert.deepEqual(result.created, ['dup@example.com'])
    assert.lengthOf(users, 1)
  })
})

test.group('User service | readUserSeeds', (group) => {
  let directory: string

  group.each.setup(async () => {
    directory = await mkdtemp(join(tmpdir(), 'user-seeds-'))
    return () => rm(directory, { recursive: true, force: true })
  })

  test('it reads a batch from a JSON file', async ({ assert }) => {
    const filePath = join(directory, 'batch.json')
    await writeFile(
      filePath,
      JSON.stringify([{ email: ' user@example.com ', fullName: 'User', territoireCodes: [' 12 '] }])
    )

    const users = await new UserService().readUserSeeds(filePath)

    assert.deepEqual(users, [
      { email: 'user@example.com', fullName: 'User', territoireCodes: ['12'] },
    ])
  })

  test('it rejects a batch with an invalid email or territoire id', async ({ assert }) => {
    const filePath = join(directory, 'batch.json')
    await writeFile(
      filePath,
      JSON.stringify([{ email: 'not-an-email' }, { email: 'ok@example.com', territoireIds: ['1'] }])
    )

    await assert.rejects(
      () => new UserService().readUserSeeds(filePath),
      /Invalid users batch:\n0\.email: .*\n1\.territoireIds\.0: /
    )
  })

  test('it rejects a file that is not JSON', async ({ assert }) => {
    const filePath = join(directory, 'batch.json')
    await writeFile(filePath, 'email,fullName')

    await assert.rejects(() => new UserService().readUserSeeds(filePath))
  })
})

test.group('User service | updateTerritoires', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  const ids = (territoires: Territoire[]) => territoires.map((t) => t.id)

  test('it attaches the territoires given by code and by id', async ({ assert }) => {
    const user = await UserFactory.merge({ email: 'user@example.com' }).create()
    const byCode = await TerritoireFactory.create()
    const byId = await TerritoireFactory.create()
    const otherTerritoire = await TerritoireFactory.create()
    const unknownId = '00000000-0000-4000-8000-000000000000'

    const [result] = await new UserService().updateTerritoires([
      { email: 'USER@example.com', add: [byCode.code!, 'unknown', byId.id, unknownId] },
    ])

    await user.load('territoires')
    assert.sameMembers(ids(user.territoires), [byCode.id, byId.id])
    assert.notInclude(ids(user.territoires), otherTerritoire.id)
    assert.equal(result.email, 'user@example.com')
    assert.isTrue(result.userFound)
    assert.sameMembers(ids(result.attached), [byCode.id, byId.id])
    assert.lengthOf(result.detached, 0)
    assert.sameMembers(ids(result.territoires), [byCode.id, byId.id])
    assert.deepEqual(result.notFound, ['unknown', unknownId])
  })

  test('it only reports the territoires that are newly attached', async ({ assert }) => {
    const user = await UserFactory.merge({ email: 'user@example.com' }).with('territoires').create()
    const [alreadyAssigned] = user.territoires
    const newTerritoire = await TerritoireFactory.create()

    const [result] = await new UserService().updateTerritoires([
      { email: 'user@example.com', add: [alreadyAssigned.id, newTerritoire.id] },
    ])

    await user.load('territoires')
    assert.sameMembers(ids(user.territoires), [alreadyAssigned.id, newTerritoire.id])
    assert.deepEqual(ids(result.attached), [newTerritoire.id])
  })

  test('it attaches and detaches in the same call', async ({ assert }) => {
    const user = await UserFactory.merge({ email: 'user@example.com' })
      .with('territoires', 2)
      .create()
    const [toRemove, toKeep] = user.territoires
    const toAdd = await TerritoireFactory.create()
    const notAssigned = await TerritoireFactory.create()

    const [result] = await new UserService().updateTerritoires([
      { email: 'user@example.com', add: [toAdd.code!], remove: [toRemove.code!, notAssigned.id] },
    ])

    await user.load('territoires')
    assert.sameMembers(ids(user.territoires), [toKeep.id, toAdd.id])
    assert.deepEqual(ids(result.attached), [toAdd.id])
    assert.deepEqual(ids(result.detached), [toRemove.id])
    assert.sameMembers(ids(result.territoires), [toKeep.id, toAdd.id])
  })

  test('it leaves the other users untouched', async ({ assert }) => {
    const territoire = await TerritoireFactory.create()
    const user = await UserFactory.merge({ email: 'user@example.com' }).create()
    const otherUser = await UserFactory.merge({ email: 'other@example.com' }).create()
    await user.related('territoires').attach([territoire.id])
    await otherUser.related('territoires').attach([territoire.id])

    await new UserService().updateTerritoires([
      { email: 'user@example.com', remove: [territoire.id] },
    ])

    await user.load('territoires')
    await otherUser.load('territoires')
    assert.lengthOf(user.territoires, 0)
    assert.deepEqual(ids(otherUser.territoires), [territoire.id])
  })

  test('it syncs the territoires to the exact given list', async ({ assert }) => {
    const user = await UserFactory.merge({ email: 'user@example.com' })
      .with('territoires', 2)
      .create()
    const [toKeep, toDetach] = user.territoires
    const toAttach = await TerritoireFactory.create()

    const [result] = await new UserService().updateTerritoires([
      { email: 'user@example.com', sync: [toKeep.code!, toAttach.id] },
    ])

    await user.load('territoires')
    assert.sameMembers(ids(user.territoires), [toKeep.id, toAttach.id])
    assert.deepEqual(ids(result.attached), [toAttach.id])
    assert.deepEqual(ids(result.detached), [toDetach.id])
  })

  test('it detaches everything when syncing an empty list', async ({ assert }) => {
    const user = await UserFactory.merge({ email: 'user@example.com' })
      .with('territoires', 2)
      .create()

    const [result] = await new UserService().updateTerritoires([
      { email: 'user@example.com', sync: [] },
    ])

    await user.load('territoires')
    assert.lengthOf(user.territoires, 0)
    assert.lengthOf(result.detached, 2)
  })

  test('it rejects a sync with an unknown territoire and writes nothing', async ({ assert }) => {
    const user = await UserFactory.merge({ email: 'user@example.com' }).with('territoires').create()
    const [assigned] = user.territoires
    const other = await UserFactory.merge({ email: 'other@example.com' }).create()
    const territoire = await TerritoireFactory.create()

    await assert.rejects(
      () =>
        new UserService().updateTerritoires([
          { email: 'other@example.com', add: [territoire.id] },
          { email: 'user@example.com', sync: ['unknown'] },
        ]),
      /Territoires not found, nothing synced: unknown/
    )

    await user.load('territoires')
    await other.load('territoires')
    assert.deepEqual(ids(user.territoires), [assigned.id])
    assert.lengthOf(other.territoires, 0)
  })

  test('it rejects inconsistent changes', async ({ assert }) => {
    const territoire = await TerritoireFactory.create()
    const service = new UserService()

    await assert.rejects(
      () =>
        service.updateTerritoires([
          { email: 'user@example.com', sync: [territoire.id] },
          { email: 'USER@example.com', add: [territoire.code!] },
        ]),
      /"user@example\.com": sync cannot be combined with add or remove/
    )
    await assert.rejects(
      () =>
        service.updateTerritoires([
          { email: 'user@example.com', add: [territoire.id], remove: [territoire.id] },
        ]),
      /"user@example\.com": both added and removed/
    )
  })

  test('it merges the changes of a duplicated email', async ({ assert }) => {
    const user = await UserFactory.merge({ email: 'user@example.com' }).create()
    const first = await TerritoireFactory.create()
    const second = await TerritoireFactory.create()

    const results = await new UserService().updateTerritoires([
      { email: 'user@example.com', add: [first.id] },
      { email: 'USER@example.com', add: [first.code!, second.code!] },
    ])

    await user.load('territoires')
    assert.sameMembers(ids(user.territoires), [first.id, second.id])
    assert.lengthOf(results, 1)
    assert.lengthOf(results[0].attached, 2)
  })

  test('it writes nothing with dryRun', async ({ assert }) => {
    const user = await UserFactory.merge({ email: 'user@example.com' }).with('territoires').create()
    const [assigned] = user.territoires
    const territoire = await TerritoireFactory.create()

    const [result] = await new UserService().updateTerritoires(
      [{ email: 'user@example.com', add: [territoire.id], remove: [assigned.id] }],
      { dryRun: true }
    )

    await user.load('territoires')
    assert.deepEqual(ids(user.territoires), [assigned.id])
    assert.deepEqual(ids(result.attached), [territoire.id])
    assert.deepEqual(ids(result.detached), [assigned.id])
    assert.deepEqual(ids(result.territoires), [territoire.id])
  })

  test('it reports the users that do not exist', async ({ assert }) => {
    const territoire = await TerritoireFactory.create()

    const [result] = await new UserService().updateTerritoires([
      { email: 'missing@example.com', add: [territoire.id] },
    ])

    await territoire.load('users')
    assert.lengthOf(territoire.users, 0)
    assert.isFalse(result.userFound)
  })
})
