import { randomBytes } from 'node:crypto'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import type { HttpContext } from '@adonisjs/core/http'
import env from '#start/env'
import User from '#models/user'

const REDIRECT_AFTER_LOGIN = '/accueil'
const SESSION_KEYS = {
  STATE: 'proconnect_state',
  NONCE: 'proconnect_nonce',
  ID_TOKEN: 'proconnect_id_token',
  LOGOUT_STATE: 'proconnect_logout_state',
}

interface OidcDiscovery {
  authorization_endpoint: string
  token_endpoint: string
  userinfo_endpoint: string
  end_session_endpoint: string
  jwks_uri: string
  issuer: string
}

let cachedDiscovery: OidcDiscovery | null = null
let cachedJWKS: ReturnType<typeof createRemoteJWKSet> | null = null

async function getDiscovery(): Promise<OidcDiscovery> {
  if (cachedDiscovery) return cachedDiscovery
  const domain = env.get('PROCONNECT_DOMAIN')
  const res = await fetch(`https://${domain}/api/v2/.well-known/openid-configuration`)
  cachedDiscovery = (await res.json()) as OidcDiscovery
  return cachedDiscovery
}

async function getJWKS() {
  if (cachedJWKS) return cachedJWKS
  const { jwks_uri } = await getDiscovery()
  cachedJWKS = createRemoteJWKSet(new URL(jwks_uri))
  return cachedJWKS
}

function flashError(session: HttpContext['session'], message: string, code?: string) {
  session.flash('error', { message, code })
}

export default class ProConnectController {
  /**
   * Génère state/nonce, les stocke en session et redirige vers ProConnect.
   */
  async redirect({ session, response }: HttpContext) {
    const { authorization_endpoint: authorizationEndpoint } = await getDiscovery()

    const state = randomBytes(32).toString('hex')
    const nonce = randomBytes(32).toString('hex')

    session.put(SESSION_KEYS.STATE, state)
    session.put(SESSION_KEYS.NONCE, nonce)

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: env.get('PROCONNECT_CLIENT_ID')!,
      redirect_uri: env.get('PROCONNECT_CALLBACK_URL')!,
      scope: 'openid email given_name usual_name',
      state,
      nonce,
    })

    return response.redirect(`${authorizationEndpoint}?${params}`)
  }

  /**
   * Point de retour après authentification ProConnect.
   * Échange le code contre des tokens, vérifie nonce, connecte l'utilisateur.
   */
  async callback({ session, request, response, auth }: HttpContext) {
    const { code, state, error } = request.qs() as Record<string, string>

    if (error) {
      flashError(session, `Connexion ProConnect annulée ou refusée.`, error)
      return response.redirect('/login')
    }

    const savedState = session.get(SESSION_KEYS.STATE) as string | null
    if (!state || state !== savedState) {
      flashError(session, 'Erreur de sécurité lors de la connexion ProConnect (state invalide).')
      return response.redirect('/login')
    }

    const { token_endpoint: tokenEndpoint, userinfo_endpoint: userinfoEndpoint } =
      await getDiscovery()

    // Échange du code d'autorisation contre les tokens
    const tokenRes = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: env.get('PROCONNECT_CLIENT_ID')!,
        client_secret: env.get('PROCONNECT_CLIENT_SECRET')!,
        redirect_uri: env.get('PROCONNECT_CALLBACK_URL')!,
        code,
      }),
    })

    if (!tokenRes.ok) {
      flashError(session, "Échec de l'échange de token avec ProConnect.")
      return response.redirect('/login')
    }

    const { access_token: accessToken, id_token: idToken } = (await tokenRes.json()) as {
      access_token: string
      id_token: string
    }

    // Vérification de la signature et des claims de l'id_token
    const jwks = await getJWKS()
    const { issuer } = await getDiscovery()
    let idTokenPayload: Record<string, unknown>
    try {
      const { payload } = await jwtVerify(idToken, jwks, {
        issuer,
        audience: env.get('PROCONNECT_CLIENT_ID')!,
      })
      idTokenPayload = payload
    } catch {
      flashError(session, 'Erreur de sécurité lors de la connexion ProConnect (token invalide).')
      return response.redirect('/login')
    }

    const savedNonce = session.get(SESSION_KEYS.NONCE) as string | null
    if (idTokenPayload['nonce'] !== savedNonce) {
      flashError(session, 'Erreur de sécurité lors de la connexion ProConnect (nonce invalide).')
      return response.redirect('/login')
    }

    // Stockage de l'id_token pour la déconnexion
    session.put(SESSION_KEYS.ID_TOKEN, idToken)
    session.forget(SESSION_KEYS.STATE)
    session.forget(SESSION_KEYS.NONCE)

    // Récupération des informations utilisateur
    const userInfoRes = await fetch(userinfoEndpoint, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    let userInfo: Record<string, string>
    const contentType = userInfoRes.headers.get('content-type') ?? ''
    if (contentType.includes('application/jwt')) {
      const jwks = await getJWKS()
      const { issuer } = await getDiscovery()
      try {
        const { payload } = await jwtVerify(await userInfoRes.text(), jwks, {
          issuer,
          audience: env.get('PROCONNECT_CLIENT_ID')!,
        })
        userInfo = payload as Record<string, string>
      } catch {
        flashError(
          session,
          'Erreur de sécurité lors de la connexion ProConnect (userinfo invalide).'
        )
        return response.redirect('/login')
      }
    } else {
      userInfo = (await userInfoRes.json()) as Record<string, string>
    }

    const email = userInfo['email']?.toLowerCase()
    const openconnectId = userInfo['sub'] as string | undefined

    if (!email) {
      flashError(session, "ProConnect n'a pas fourni d'adresse e-mail.")
      return response.redirect('/login')
    }

    // 1. Cherche par openconnect_id
    let user = openconnectId ? await User.findBy('openconnect_id', openconnectId) : null

    // 2. Sinon, cherche par email
    if (!user) {
      user = await User.findBy('email', email)

      if (user) {
        // Enregistre l'openconnect_id pour les prochaines connexions
        user.openconnectId = openconnectId ?? null
        await user.save()
      }
    }

    // 3. Aucun compte trouvé — on ne crée pas
    if (!user) {
      flashError(
        session,
        'Aucun compte ne correspond à cet identifiant. Contactez votre administrateur.'
      )
      return response.redirect('/login')
    }

    await auth.use('web').login(user)

    return response.redirect(REDIRECT_AFTER_LOGIN)
  }

  /**
   * Déconnecte l'utilisateur de ProConnect (redirection vers end_session_endpoint).
   */
  async logout({ session, response, auth }: HttpContext) {
    const idToken = session.get(SESSION_KEYS.ID_TOKEN) as string | null

    await auth.use('web').logout()

    if (!idToken) {
      return response.redirect('/login')
    }

    const { end_session_endpoint: endSessionEndpoint } = await getDiscovery()

    const state = randomBytes(32).toString('hex')
    session.put(SESSION_KEYS.LOGOUT_STATE, state)

    const params = new URLSearchParams({
      id_token_hint: idToken,
      state,
      post_logout_redirect_uri: env.get('PROCONNECT_POST_LOGOUT_REDIRECT_URI')!,
    })

    return response.redirect(`${endSessionEndpoint}?${params}`)
  }

  /**
   * Point de retour après déconnexion ProConnect.
   */
  async logoutCallback({ session, request, response }: HttpContext) {
    const { state } = request.qs() as Record<string, string>
    const savedState = session.get(SESSION_KEYS.LOGOUT_STATE) as string | null

    if (state !== savedState) {
      flashError(session, 'Erreur de sécurité lors de la déconnexion ProConnect.')
    }

    session.forget(SESSION_KEYS.ID_TOKEN)
    session.forget(SESSION_KEYS.LOGOUT_STATE)

    return response.redirect('/login')
  }
}
