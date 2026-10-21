import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Rejette les requêtes dont le corps est compressé (en-tête `Content-Encoding`).
 *
 * Mesure temporaire contre la CVE-2026-111497 (exécution de code à distance via le
 * décodeur Brotli de Node.js < 24.22.1) : le body parser décompresse ces corps avant
 * toute authentification, y compris sur `POST /login`. Les navigateurs n'envoient
 * jamais de corps compressé, ce rejet n'affecte donc pas l'application.
 *
 * À retirer une fois Node.js 24.22.1 ou plus déployé sur l'hébergeur.
 */
export default class RejectEncodedBodyMiddleware {
  handle({ request, response }: HttpContext, next: NextFn) {
    const encoding = request.header('content-encoding')?.trim().toLowerCase()

    if (encoding && encoding !== 'identity') {
      return response.unsupportedMediaType('Unsupported Content-Encoding')
    }

    return next()
  }
}
