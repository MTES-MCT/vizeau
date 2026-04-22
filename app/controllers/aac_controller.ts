import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { AacService } from '#services/aac_service'
import { AacDto } from '../dto/aac_dto.js'
import { analysesSummaryValidator, analysesValidator } from '#validators/aac'
import type { AacAnalysesSummaryJson } from '../../types/aac.js'
import { AacCsvService } from '#services/aac_csv_service'
import router from '@adonisjs/core/services/router'

const PER_PAGE = 20

@inject()
export default class AacController {
  constructor(
    public aacService: AacService,
    public aacCsvService: AacCsvService
  ) {}

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

    return inertia.render('aac/id', {
      aac: AacDto.fromRaw(raw),
      exportUrls: {
        infoGenerale: router.builder().params([params.code]).make('aac.export.infoGenerale'),
        captages: router.builder().params([params.code]).make('aac.export.captages'),
        assolement: router.builder().params([params.code]).make('aac.export.assolement'),
        cultureEvolution: router
          .builder()
          .params([params.code])
          .make('aac.export.cultureEvolution'),
        qualiteEau: router.builder().params([params.code]).make('aac.export.qualite'),
      },
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

  async analyses({ params, request, response }: HttpContext) {
    const valid = await this.aacService.hasInstallation(params.code, params.installationCode)
    if (!valid) return response.abort('AAC ou installation introuvable', 404)

    const { year } = await request.validateUsing(analysesValidator)

    const data = await this.aacService.getAnalysesRobinet(params.installationCode, year)
    return response.json(data)
  }

  async exportInfoGenerale({ params, response }: HttpContext) {
    return this.sendCsvExport(response, params.code, 'info-generale', () =>
      this.aacCsvService.exportInfoGenerale(params.code)
    )
  }

  async exportCaptages({ params, response }: HttpContext) {
    return this.sendCsvExport(response, params.code, 'captages', () =>
      this.aacCsvService.exportCaptages(params.code)
    )
  }

  async exportAssolement({ params, response }: HttpContext) {
    return this.sendCsvExport(response, params.code, 'assolement', () =>
      this.aacCsvService.exportAssolement(params.code)
    )
  }

  async exportCultureEvolution({ params, response }: HttpContext) {
    return this.sendCsvExport(response, params.code, 'culture-evolution', () =>
      this.aacCsvService.exportCultureEvolution(params.code)
    )
  }

  async exportQualiteEau({ params, response }: HttpContext) {
    return this.sendCsvExport(response, params.code, 'qualite-eau', () =>
      this.aacCsvService.exportQualiteEau(params.code)
    )
  }

  private async sendCsvExport(
    response: HttpContext['response'],
    code: string,
    suffix: string,
    generate: () => Promise<string | null>
  ) {
    const csv = await generate()
    if (!csv) {
      return response.abort(`AAC avec le code "${code}" introuvable`, 404)
    }

    const date = new Date().toISOString().slice(0, 10)
    const filename = `aac-${code}-${suffix}-${date}.csv`

    return response
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header('Content-Disposition', `attachment; filename="${filename}"`)
      .send(csv)
  }

  async analysesYears({ params, response }: HttpContext) {
    const valid = await this.aacService.hasInstallation(params.code, params.installationCode)
    if (!valid) return response.abort('AAC ou installation introuvable', 404)

    const years = await this.aacService.getAnalysesRobinetYears(params.installationCode)
    return response.json(years)
  }
}
