import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { InferSharedProps } from '@adonisjs/inertia/types'
import BaseInertiaMiddleware from '@adonisjs/inertia/inertia_middleware'
import type { FlashMessageType, FlashMessageValue } from '#types/flash_messages'
import UserTransformer from '#transformers/user_transformer'
import env from '#start/env'

export default class InertiaMiddleware extends BaseInertiaMiddleware {
  share(ctx: HttpContext) {
    /**
     * The share method is called every time an Inertia page is rendered. In
     * certain cases, a page may get rendered before the session middleware
     * or the auth middleware are executed. For example: During a 404 request.
     *
     * In that case, we must always assume that HttpContext is not fully hydrated
     * with all the properties.
     */
    const { auth } = ctx as Partial<HttpContext>

    /**
     * Data shared with all Inertia pages. Make sure you are using
     * transformers for rich data-types like Models.
     */
    return {
      user: ctx.inertia.always(auth?.user ? UserTransformer.transform(auth.user) : undefined),
      errors: ctx.inertia.always(this.getValidationErrors(ctx)),
      // URL de base des tuiles du RPG, lue par les cartes qui affichent les parcelles agricoles
      rpgPmtilesUrl: env.get('RPG_PMTILES_URL', ''),
      // Millésimes du RPG, du plus récent au plus ancien, et celui affiché par défaut
      rpgMillesimes: env.get('RPG_MILLESIMES'),
      rpgDefaultMillesime: env.get('RPG_DEFAULT_MILLESIME'),
      // Recherche de parcelles par PACAGE, possible quand les Parquet du RPG sont configurés
      rpgPacageSearch: Boolean(env.get('RPG_PARQUET_URL')),
    }
  }

  flash(ctx: HttpContext) {
    const { session } = ctx as Partial<HttpContext>

    return session?.flashMessages?.toJSON() as Record<FlashMessageType, FlashMessageValue>
  }

  async handle(ctx: HttpContext, next: NextFn) {
    await this.init(ctx)
    const output = await next()
    this.dispose(ctx)
    return output
  }
}

declare module '@adonisjs/inertia/types' {
  interface SharedProps extends InferSharedProps<InertiaMiddleware> {}
}
