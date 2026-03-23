import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { AacService } from '#services/aac_service'
import { AacDto, type InstallationInfo } from '../dto/aac_dto.js'

const PER_PAGE = 20

@inject()
export default class AacController {
  constructor(public aacService: AacService) {}

  async index({ request, inertia }: HttpContext) {
    const page = Math.max(1, Number.parseInt(request.input('page', '1'), 10) || 1)
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
      return response.abort(`AAC avec le code "${params.code}" introuvable`, 404)
    }

    return inertia.render('aac/id', { aac: AacDto.fromRaw(raw) })
  }

  async analyses({ params, request, response }: HttpContext) {
    const aac = await this.aacService.getByCode(params.code)
    if (!aac) return response.abort('AAC introuvable', 404)

    const installations = (aac.installations as InstallationInfo[]) ?? []
    if (!installations.some((i) => i.code === params.installationCode)) {
      return response.abort('Installation introuvable pour cette AAC', 404)
    }

    const yearParam = request.input('year')
    const year = yearParam ? Number.parseInt(yearParam, 10) : Number.NaN
    if (!yearParam || Number.isNaN(year)) {
      return response.abort('Le paramètre year est requis', 400)
    }

    const data = await this.aacService.getAnalysesRobinet(params.installationCode, year)
    return response.json(data)
  }

  async analysesYears({ params, response }: HttpContext) {
    const aac = await this.aacService.getByCode(params.code)
    if (!aac) return response.abort('AAC introuvable', 404)

    const installations = (aac.installations as InstallationInfo[]) ?? []
    if (!installations.some((i) => i.code === params.installationCode)) {
      return response.abort('Installation introuvable pour cette AAC', 404)
    }

    const years = await this.aacService.getAnalysesRobinetYears(params.installationCode)
    return response.json(years)
  }
}
