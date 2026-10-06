import app from '@adonisjs/core/services/app'
import { defineConfig } from '@adonisjs/core/http'

/**
 * The configuration settings used by the HTTP server
 */
export const http = defineConfig({
  generateRequestId: true,
  allowMethodSpoofing: false,

  /**
   * Enabling async local storage will let you access HTTP context
   * from anywhere inside your application.
   */
  useAsyncLocalStorage: false,

  /**
   * L'application est déployée derrière les routeurs Scalingo, qui transmettent
   * l'IP du client dans l'en-tête X-Real-IP. Sans cela, request.ip() renverrait
   * l'IP du routeur pour toutes les requêtes, ce qui fausserait la limitation des
   * tentatives de connexion.
   * Attention : l'en-tête peut être falsifié si l'application est exposée sans
   * reverse proxy qui le réécrit.
   */
  getIp(request, originalFn) {
    return request.header('x-real-ip') ?? originalFn()
  },

  /**
   * Manage cookies configuration. The settings for the session id cookie are
   * defined inside the "config/session.ts" file.
   */
  cookie: {
    domain: '',
    path: '/',
    maxAge: '2h',
    httpOnly: true,
    secure: app.inProduction,
    sameSite: 'lax',
  },
})
