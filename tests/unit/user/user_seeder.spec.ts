import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import hash from '@adonisjs/core/services/hash'
import db from '@adonisjs/lucid/services/db'
import Env from '#start/env'
import User from '#models/user'
import UserSeeder from '#database/seeders/1_user_seeder'
import { UserFactory } from '#database/factories/user_factory'

const TEST_USER_EMAIL = 'test@vizeau.beta.gouv.fr'

function runSeeder() {
  return new UserSeeder(db.connection()).run()
}

test.group('User seeder', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.teardown(() => {
    Env.set('DRY_RUN', false)
    Env.set('NODE_ENV', 'test')
  })

  test('it creates the admin and the test user', async ({ assert }) => {
    await runSeeder()

    const admin = await User.findByOrFail('email', Env.get('ADMIN_EMAIL'))
    assert.isTrue(await hash.verify(admin.password, Env.get('ADMIN_PASSWORD')))
    assert.exists(await User.findBy('email', TEST_USER_EMAIL))
  })

  test('it does not create the test user in production', async ({ assert }) => {
    Env.set('NODE_ENV', 'production')

    await runSeeder()

    assert.exists(await User.findBy('email', Env.get('ADMIN_EMAIL')))
    assert.isNull(await User.findBy('email', TEST_USER_EMAIL))
  })

  test('it leaves the existing admin untouched', async ({ assert }) => {
    const admin = await UserFactory.merge({
      email: Env.get('ADMIN_EMAIL'),
      fullName: 'Existing Admin',
    }).create()

    await runSeeder()

    await admin.refresh()
    assert.equal(admin.fullName, 'Existing Admin')
    assert.isTrue(await hash.verify(admin.password, 'password'))
  })

  test('it writes nothing with DRY_RUN', async ({ assert }) => {
    Env.set('DRY_RUN', true)

    await runSeeder()

    assert.isNull(await User.findBy('email', Env.get('ADMIN_EMAIL')))
  })
})
