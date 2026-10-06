import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { GlobalSearchService } from '#services/global_search_service'
import { GlobalSearchDto } from '../dto/global_search_dto.js'
import { globalSearchValidator } from '#validators/recherche'

@inject()
export default class RechercheController {
  constructor(public globalSearchService: GlobalSearchService) {}

  async index({ request, response, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const { q } = await request.validateUsing(globalSearchValidator)

    const results = await this.globalSearchService.search(q, user.id)

    return response.json(GlobalSearchDto.toGroups(results))
  }
}
