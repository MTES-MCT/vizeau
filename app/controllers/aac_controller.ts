import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { AacService } from '#services/aac_service'
import { AacDto } from '../dto/aac_dto.js'

const PER_PAGE = 20

@inject()
export default class AacController {
  constructor(public aacService: AacService) {}

  async index({ request, inertia }: HttpContext) {
    const page = Number(request.input('page', 1))
    const recherche = request.input('recherche') || undefined
    const commune = request.input('commune') || undefined

    const { data, total } = await this.aacService.getAll(page, PER_PAGE, recherche, commune)
    const lastPage = Math.max(1, Math.ceil(total / PER_PAGE))

    return inertia.render('aac/index', {
      aacs: data.map(AacDto.fromRawSummary),
      meta: { total, perPage: PER_PAGE, currentPage: page, lastPage },
      queryString: { recherche: recherche ?? '', commune: commune ?? '', page: String(page) },
    })
  }

  async show({ params, inertia, response }: HttpContext) {
    const raw = await this.aacService.getByCode(params.code)

    if (!raw) {
      return response.notFound({ message: `AAC avec le code "${params.code}" introuvable` })
    }

    return inertia.render('aac/id', { aac: AacDto.fromRaw(raw) })
  }
}
