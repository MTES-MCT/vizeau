import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import limiter from '@adonisjs/limiter/services/main'
import type { ApiClient } from '@japa/api-client'
import { UserFactory } from '#database/factories/user_factory'

function login(client: ApiClient, email: string, password: string, ip = '203.0.113.1') {
  return client
    .post('/login')
    .header('X-Real-IP', ip)
    .form({ email, password })
    .withCsrfToken()
    .redirects(0)
}

// Les emails sont stockés en minuscules, alors que la factory peut générer des majuscules
function createUser() {
  return UserFactory.tap((user) => {
    user.email = user.email.toLowerCase()
  }).create()
}

async function failLogin(client: ApiClient, email: string, times: number, ip?: string) {
  for (let i = 0; i < times; i++) {
    const response = await login(client, email, 'mauvais-mot-de-passe', ip)
    response.assertFlashMessage('error', {
      message: 'Invalid user credentials',
      code: 'E_INVALID_CREDENTIALS',
      context: 'login',
    })
  }
}

test.group('Session - Connexion', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => () => limiter.clear(['memory']))

  test('je peux me connecter avec des identifiants valides', async ({ client }) => {
    const user = await createUser()

    const response = await login(client, user.email, 'password')

    response.assertStatus(302)
    response.assertHeader('location', '/accueil')
  })

  test("l'email est insensible à la casse", async ({ client }) => {
    await UserFactory.merge({ email: 'agent@example.fr' }).create()

    const response = await login(client, ' Agent@Example.fr ', 'password')

    response.assertHeader('location', '/accueil')
  })

  test('une requête sans email est rejetée par la validation', async ({ client }) => {
    const response = await client
      .post('/login')
      .form({ password: 'password' })
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(302)
    response.assertHeader('location', '/')
  })

  test('le compte est bloqué après 5 échecs, même avec le bon mot de passe', async ({ client }) => {
    const user = await createUser()
    await failLogin(client, user.email, 5)

    const response = await login(client, user.email, 'password')

    response.assertStatus(302)
    response.assertHeader('location', '/')
    response.assertFlashMessage('error', {
      message: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.',
      code: 'E_TOO_MANY_REQUESTS',
      context: 'login',
    })
  })

  test('une connexion réussie remet le compteur à zéro', async ({ client }) => {
    const user = await createUser()
    await failLogin(client, user.email, 4)
    await login(client, user.email, 'password')
    await failLogin(client, user.email, 4)

    const response = await login(client, user.email, 'password')

    response.assertHeader('location', '/accueil')
  })

  test("le blocage ne s'applique pas depuis une autre IP", async ({ client }) => {
    const user = await createUser()
    await failLogin(client, user.email, 5, '203.0.113.1')

    const response = await login(client, user.email, 'password', '203.0.113.2')

    response.assertHeader('location', '/accueil')
  })

  test("une IP est bloquée après 20 tentatives en une minute, quel que soit l'email", async ({
    client,
  }) => {
    const user = await createUser()
    for (let i = 0; i < 20; i++) {
      await login(client, `inconnu-${i}@example.fr`, 'mauvais-mot-de-passe')
    }

    const blocked = await login(client, user.email, 'password')
    blocked.assertHeader('location', '/')
    blocked.assertFlashMessage('error', {
      message: 'Trop de tentatives de connexion. Veuillez réessayer dans 1 minute.',
      code: 'E_TOO_MANY_REQUESTS',
      context: 'login',
    })

    const otherIp = await login(client, user.email, 'password', '203.0.113.2')
    otherIp.assertHeader('location', '/accueil')
  })
})
