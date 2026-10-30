import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import hash from '@adonisjs/core/services/hash'
import UserService from '#services/user_service'
import User from '#models/user'
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

test.group('User service | assignTerritoires', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('it attaches the territoires given by code and by id', async ({ assert }) => {
    const user = await UserFactory.merge({ email: 'user@example.com' }).create()
    const byCode = await TerritoireFactory.create()
    const byId = await TerritoireFactory.create()
    const otherTerritoire = await TerritoireFactory.create()
    const unknownId = '00000000-0000-4000-8000-000000000000'

    const result = await new UserService().assignTerritoires([
      {
        email: 'USER@example.com',
        territoireCodes: [byCode.code!, 'unknown'],
        territoireIds: [byId.id, unknownId],
      },
    ])

    await user.load('territoires')
    const territoireIds = user.territoires.map((t) => t.id)
    assert.sameMembers(territoireIds, [byCode.id, byId.id])
    assert.notInclude(territoireIds, otherTerritoire.id)
    assert.deepEqual(result, [
      {
        email: 'user@example.com',
        userFound: true,
        attached: 2,
        notFoundCodes: ['unknown'],
        notFoundIds: [unknownId],
      },
    ])
  })

  test('it never detaches and only counts new territoires', async ({ assert }) => {
    const user = await UserFactory.merge({ email: 'user@example.com' }).with('territoires').create()
    const [alreadyAssigned] = user.territoires
    const newTerritoire = await TerritoireFactory.create()

    const [result] = await new UserService().assignTerritoires([
      { email: 'user@example.com', territoireIds: [alreadyAssigned.id, newTerritoire.id] },
    ])

    await user.load('territoires')
    assert.sameMembers(
      user.territoires.map((t) => t.id),
      [alreadyAssigned.id, newTerritoire.id]
    )
    assert.equal(result.attached, 1)
  })

  test('it attaches a territoire once when the email is duplicated', async ({ assert }) => {
    const user = await UserFactory.merge({ email: 'user@example.com' }).create()
    const territoire = await TerritoireFactory.create()

    const result = await new UserService().assignTerritoires([
      { email: 'user@example.com', territoireIds: [territoire.id] },
      { email: 'USER@example.com', territoireCodes: [territoire.code!] },
    ])

    await user.load('territoires')
    assert.lengthOf(user.territoires, 1)
    assert.deepEqual(
      result.map((r) => r.attached),
      [1, 0]
    )
  })

  test('it writes nothing with dryRun', async ({ assert }) => {
    const user = await UserFactory.merge({ email: 'user@example.com' }).create()
    const territoire = await TerritoireFactory.create()

    const [result] = await new UserService().assignTerritoires(
      [{ email: 'user@example.com', territoireIds: [territoire.id] }],
      { dryRun: true }
    )

    await user.load('territoires')
    assert.lengthOf(user.territoires, 0)
    assert.equal(result.attached, 1)
  })

  test('it skips the users that do not exist', async ({ assert }) => {
    const territoire = await TerritoireFactory.create()

    const [result] = await new UserService().assignTerritoires([
      { email: 'missing@example.com', territoireIds: [territoire.id] },
    ])

    await territoire.load('users')
    assert.lengthOf(territoire.users, 0)
    assert.isFalse(result.userFound)
  })
})
