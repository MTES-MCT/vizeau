import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import router from '@adonisjs/core/services/router'

export default class TerritoireAssignationMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    /**
     * Middleware logic goes here (before the next call)
     */
    const user = ctx.auth.getUserOrFail()

    // Load the user's territoires. If no territoire is found, redirect to an error page.
    await user.loadOnce('territoires')

    if (user.territoires.length === 0) {
      return ctx.response.redirect(router.builder().make('noTerritoire'))
    }

    /**
     * Call next method in the pipeline and return its output
     */
    const output = await next()
    return output
  }
}
