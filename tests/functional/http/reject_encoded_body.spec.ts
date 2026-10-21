import { brotliCompressSync, gzipSync } from 'node:zlib'
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { UserFactory } from '#database/factories/user_factory'

// Protection contre la CVE-2026-111497 : aucun corps compressé ne doit atteindre le body parser
test.group('Requêtes avec un corps compressé', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('une connexion avec un corps Brotli est rejetée', async ({ client }) => {
    const body = brotliCompressSync(JSON.stringify({ email: 'a@example.fr', password: 'x' }))

    const response = await client
      .post('/login')
      .header('content-encoding', 'br')
      .unsafeJson(body)
      .redirects(0)

    response.assertStatus(415)
  })

  test('un corps gzip est également rejeté', async ({ client }) => {
    const response = await client
      .post('/login')
      .header('content-encoding', 'gzip')
      .unsafeJson(gzipSync('{}'))
      .redirects(0)

    response.assertStatus(415)
  })

  test('une route protégée rejette aussi un corps compressé', async ({ client }) => {
    const user = await UserFactory.create()

    const response = await client
      .post('/exploitations/creation')
      .loginAs(user)
      .header('content-encoding', 'br')
      .unsafeJson(brotliCompressSync('{}'))
      .redirects(0)

    response.assertStatus(415)
  })

  test("une requête avec l'encodage identity passe", async ({ client }) => {
    const response = await client
      .post('/login')
      .header('content-encoding', 'identity')
      .form({ email: 'inconnu@example.fr', password: 'x' })
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(302)
  })
})
