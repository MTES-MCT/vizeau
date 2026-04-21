import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { AacService } from '#services/aac_service'
import { AacDto } from '../dto/aac_dto.js'
import User from '#models/user'

const PER_PAGE = 20

async function getUserTerritoireCodes(user: User): Promise<string[]> {
  await user.loadOnce('territoires')

  return user.territoires.flatMap((territoire) => (territoire.code ? [territoire.code] : []))
}

@inject()
export default class AacController {
  constructor(public aacService: AacService) {}

  async index({ request, inertia, auth }: HttpContext) {
    // Backward compatibility for legacy bookmarks/links using page/recherche/commune.
    const pageInput = request.input('aacPage') || request.input('page') || '1'
    const rechercheInput = request.input('aacRecherche') ?? request.input('recherche')
    const communeInput = request.input('aacCommune') ?? request.input('commune')
    const user = auth.getUserOrFail()
    const userTerritoireCodes = await getUserTerritoireCodes(user)

    const page = Math.max(1, Number.parseInt(pageInput, 10) || 1)
    const recherche = rechercheInput || undefined
    const commune = communeInput || undefined

    const { data, total } = await this.aacService.getAll(
      page,
      PER_PAGE,
      recherche,
      commune,
      userTerritoireCodes
    )
    const lastPage = Math.max(1, Math.ceil(total / PER_PAGE))

    return inertia.render('aac/index', {
      aacs: data.map(AacDto.fromRawSummary),
      meta: { total, perPage: PER_PAGE, currentPage: page, lastPage },
      queryString: {
        aacRecherche: recherche ?? '',
        aacCommune: commune ?? '',
        aacPage: String(page),
      },
    })
  }

  async show({ params, inertia, response, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const userTerritoireCodes = await getUserTerritoireCodes(user)

    if (!userTerritoireCodes.includes(params.code)) {
      return response.abort(`AAC avec le code "${params.code}" introuvable`, 404)
    }

    const raw = await this.aacService.getByCode(params.code)

    if (!raw) {
      return response.abort(`AAC avec le code "${params.code}" introuvable`, 404)
    }

    return inertia.render('aac/id', { aac: AacDto.fromRaw(raw) })
  }

  async analyses({ params, request, response, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const userTerritoireCodes = await getUserTerritoireCodes(user)

    if (!userTerritoireCodes.includes(params.code)) {
      return response.abort('AAC ou installation introuvable', 404)
    }

    const valid = await this.aacService.hasInstallation(params.code, params.installationCode)
    if (!valid) return response.abort('AAC ou installation introuvable', 404)

    const yearParam = request.input('year')
    const year = yearParam ? Number.parseInt(yearParam, 10) : Number.NaN
    if (!yearParam || Number.isNaN(year)) {
      return response.abort('Le paramètre year est requis', 400)
    }

    const data = await this.aacService.getAnalysesRobinet(params.installationCode, year)
    return response.json(data)
  }

  async analysesYears({ params, response, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const userTerritoireCodes = await getUserTerritoireCodes(user)

    if (!userTerritoireCodes.includes(params.code)) {
      return response.abort('AAC ou installation introuvable', 404)
    }

    const valid = await this.aacService.hasInstallation(params.code, params.installationCode)
    if (!valid) return response.abort('AAC ou installation introuvable', 404)

    const years = await this.aacService.getAnalysesRobinetYears(params.installationCode)
    return response.json(years)
  }
}
