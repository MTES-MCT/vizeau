import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { AacService } from '#services/aac_service'
import { AacDto } from '../dto/aac_dto.js'

const PER_PAGE = 20

@inject()
export default class AacController {
  constructor(public aacService: AacService) {}

  async index({ request, inertia }: HttpContext) {
    // Backward compatibility for legacy bookmarks/links using page/recherche/commune.
    const pageInput = request.input('aacPage') || request.input('page') || '1'
    const rechercheInput = request.input('aacRecherche') ?? request.input('recherche')
    const communeInput = request.input('aacCommune') ?? request.input('commune')

    const page = Math.max(1, Number.parseInt(pageInput, 10) || 1)
    const recherche = rechercheInput || undefined
    const commune = communeInput || undefined

    const { data, total } = await this.aacService.getAll(page, PER_PAGE, recherche, commune)
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

  async show({ params, inertia, response }: HttpContext) {
    const raw = await this.aacService.getByCode(params.code)

    if (!raw) {
      return response.abort(`AAC avec le code "${params.code}" introuvable`, 404)
    }

    return inertia.render('aac/id', { aac: AacDto.fromRaw(raw) })
  }

  async analysesSummary({ params, request, response }: HttpContext) {
    const raw = await this.aacService.getByCode(params.code)
    if (!raw) return response.abort('AAC introuvable', 404)

    const installations = (raw.installations as { code: string }[]) ?? []
    const codes = installations.map((i) => i.code)

    const yearFromParam = request.input('yearFrom')
    const yearToParam = request.input('yearTo')
    const yearFrom =
      yearFromParam !== undefined && yearFromParam !== null && yearFromParam !== ''
        ? Number.parseInt(String(yearFromParam), 10)
        : undefined
    const yearTo =
      yearToParam !== undefined && yearToParam !== null && yearToParam !== ''
        ? Number.parseInt(String(yearToParam), 10)
        : undefined

    if (
      (yearFromParam !== undefined &&
        yearFromParam !== null &&
        yearFromParam !== '' &&
        Number.isNaN(yearFrom)) ||
      (yearToParam !== undefined &&
        yearToParam !== null &&
        yearToParam !== '' &&
        Number.isNaN(yearTo))
    ) {
      return response.abort(
        'Les paramètres yearFrom et yearTo doivent être des entiers valides',
        400
      )
    }

    if (yearFrom !== undefined && yearTo !== undefined && yearFrom > yearTo) {
      return response.abort('Le paramètre yearFrom doit être inférieur ou égal à yearTo', 400)
    }
    const includeYearRange = yearFrom === undefined && yearTo === undefined
    const [summary, conformite, yearRange] = await Promise.all([
      this.aacService.getAnalysesSummary(codes, yearFrom, yearTo),
      this.aacService.getConformiteSummary(codes, yearFrom, yearTo),
      includeYearRange ? this.aacService.getAnalysesYearRange(codes) : Promise.resolve(null),
    ])
    return response.json({
      ...summary,
      ...conformite,
      ...(yearRange ?? {}),
    })
  }

  async analyses({ params, request, response }: HttpContext) {
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

  async analysesYears({ params, response }: HttpContext) {
    const valid = await this.aacService.hasInstallation(params.code, params.installationCode)
    if (!valid) return response.abort('AAC ou installation introuvable', 404)

    const years = await this.aacService.getAnalysesRobinetYears(params.installationCode)
    return response.json(years)
  }
}
