import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { AacService } from '#services/aac_service'
import { AacDto } from '../dto/aac_dto.js'
import { analysesSummaryValidator, analysesValidator } from '#validators/aac'
import type { AacAnalysesSummaryJson } from '../../types/aac.js'

const PER_PAGE = 20

function parseYearRange(
  yearMinParam: string | null,
  yearMaxParam: string | null
): { yearMin: number; yearMax: number } | { error: string } {
  const yearMin = yearMinParam ? Number.parseInt(yearMinParam, 10) : Number.NaN
  const yearMax = yearMaxParam ? Number.parseInt(yearMaxParam, 10) : Number.NaN
  if (!yearMinParam || !yearMaxParam || Number.isNaN(yearMin) || Number.isNaN(yearMax)) {
    return { error: 'Les paramètres yearMin et yearMax sont requis' }
  }
  if (yearMin > yearMax) {
    return { error: 'yearMin ne peut pas être supérieur à yearMax' }
  }
  return { yearMin, yearMax }
}

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

  async showInstallation({ params, inertia, response }: HttpContext) {
    const raw = await this.aacService.getByCode(params.code)
    if (!raw) {
      return response.abort(`AAC avec le code "${params.code}" introuvable`, 404)
    }

    const aac = AacDto.fromRaw(raw)
    const installation = aac.installations.find((i) => i.code === params.installationCode)
    if (!installation) {
      return response.abort(
        `Installation "${params.installationCode}" introuvable dans l'AAC "${params.code}"`,
        404
      )
    }

    return inertia.render('aac/captage', {
      aac: { code: aac.code, nom: aac.nom },
      installation,
    })
  }

  async analysesSummary({ params, request, response }: HttpContext) {
    const codes = await this.aacService.getInstallationCodesByAacCode(params.code)
    if (!codes) return response.abort('AAC introuvable', 404)

    const { yearFrom, yearTo } = await request.validateUsing(analysesSummaryValidator)

    if (yearFrom !== undefined && yearTo !== undefined && yearFrom > yearTo) {
      return response.abort('Le paramètre yearFrom doit être inférieur ou égal à yearTo', 400)
    }
    const includeYearRange = yearFrom === undefined && yearTo === undefined
    const [summary, yearRange] = await Promise.all([
      this.aacService.getAnalysesSummary(codes, yearFrom, yearTo),
      includeYearRange ? this.aacService.getAnalysesYearRange(codes) : Promise.resolve(null),
    ])
    return response.json({
      ...summary,
      ...(yearRange ?? {}),
    } satisfies AacAnalysesSummaryJson)
  }

  async substances({ params, request, response }: HttpContext) {
    const valid = await this.aacService.hasInstallation(params.code, params.installationCode)
    if (!valid) return response.abort('AAC ou installation introuvable', 404)

    const range = parseYearRange(request.input('yearMin'), request.input('yearMax'))
    if ('error' in range) return response.abort(range.error, 400)
    const { yearMin, yearMax } = range

    const data = await this.aacService.getSubstances(params.installationCode, yearMin, yearMax)
    return response.json(data)
  }

  async substanceChronique({ params, request, response }: HttpContext) {
    const valid = await this.aacService.hasInstallation(params.code, params.installationCode)
    if (!valid) return response.abort('AAC ou installation introuvable', 404)

    const codeParametre = Number.parseInt(params.codeParametre, 10)
    if (Number.isNaN(codeParametre)) return response.abort('Code paramètre invalide', 400)

    const range = parseYearRange(request.input('yearMin'), request.input('yearMax'))
    if ('error' in range) return response.abort(range.error, 400)
    const { yearMin, yearMax } = range

    const data = await this.aacService.getSubstanceChronique(
      params.installationCode,
      codeParametre,
      yearMin,
      yearMax
    )
    return response.json(data)
  }

  async analysesPerYear({ params, request, response }: HttpContext) {
    const valid = await this.aacService.hasInstallation(params.code, params.installationCode)
    if (!valid) return response.abort('AAC ou installation introuvable', 404)

    const range = parseYearRange(request.input('yearMin'), request.input('yearMax'))
    if ('error' in range) return response.abort(range.error, 400)
    const { yearMin, yearMax } = range

    const data = await this.aacService.getAnalysesPerYear(params.installationCode, yearMin, yearMax)
    return response.json(data)
  }

  async analysesStats({ params, request, response }: HttpContext) {
    const valid = await this.aacService.hasInstallation(params.code, params.installationCode)
    if (!valid) return response.abort('AAC ou installation introuvable', 404)

    const range = parseYearRange(request.input('yearMin'), request.input('yearMax'))
    if ('error' in range) return response.abort(range.error, 400)
    const { yearMin, yearMax } = range

    const data = await this.aacService.getAnalysesStats(params.installationCode, yearMin, yearMax)
    return response.json(data)
  }

  async analyses({ params, request, response }: HttpContext) {
    const valid = await this.aacService.hasInstallation(params.code, params.installationCode)
    if (!valid) return response.abort('AAC ou installation introuvable', 404)

    const { year } = await request.validateUsing(analysesValidator)

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
