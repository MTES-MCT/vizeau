import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { AacService } from '#services/aac_service'
import { AacDto } from '../dto/aac_dto.js'
import {
  analysesSummaryValidator,
  analysesValidator,
  depassementsFiltersValidator,
  yearRangeValidator,
} from '#validators/aac'
import type { AacAnalysesSummaryJson } from '#types/aac'
import { AacCsvService } from '#services/aac_csv_service'
import env from '#start/env'

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
    const {
      aacDepassementsReglementaires: depassementsReglementaires = false,
      aacDepassementsAlerte: depassementsAlerte = false,
    } = await request.validateUsing(depassementsFiltersValidator)

    // Requête partagée entre les deux props différées pour ne l'exécuter qu'une fois
    let aacsPromise: ReturnType<AacService['getAll']> | undefined
    const getAacs = () =>
      (aacsPromise ??= this.aacService.getAll(
        page,
        PER_PAGE,
        recherche,
        commune,
        undefined,
        depassementsReglementaires,
        depassementsAlerte
      ))

    return inertia.render('aac/index', {
      aacs: inertia.defer(async () => {
        const aacsWithMeta = await getAacs()
        return aacsWithMeta.data.map(AacDto.fromRawSummary)
      }, 'aacs'),
      meta: inertia.defer(async () => {
        const { total } = await getAacs()
        const lastPage = Math.max(1, Math.ceil(total / PER_PAGE))
        return { total, perPage: PER_PAGE, currentPage: page, lastPage }
      }, 'aacs'),
      queryString: {
        aacRecherche: recherche ?? '',
        aacCommune: commune ?? '',
        aacPage: String(page),
        aacDepassementsReglementaires: String(depassementsReglementaires),
        aacDepassementsAlerte: String(depassementsAlerte),
      },
    })
  }

  async show({ params, inertia, response, auth }: HttpContext) {
    const raw = await this.aacService.getByCode(params.code)

    if (!raw) {
      return response.abort(`AAC avec le code "${params.code}" introuvable`, 404)
    }

    const aac = AacDto.fromRaw(raw)

    const conformiteByInstallation = await this.aacService.getConformiteStatsByInstallation(
      aac.installations.map((installation) => installation.code)
    )
    aac.installations = aac.installations.map((installation) => ({
      ...installation,
      depassements_alerte:
        conformiteByInstallation.get(installation.code)?.depassements_alerte ?? 0,
      depassements_reglementaires:
        conformiteByInstallation.get(installation.code)?.depassements_reglementaires ?? 0,
    }))

    // L'AAC n'est un territoire de l'utilisateur que s'il y est rattaché : lui seul peut
    // rebondir vers la carte, dont les données sont restreintes à ses territoires.
    const user = auth.getUserOrFail()
    const isTerritoire = user.territoires.some((territoire) => territoire.code === aac.code)

    return inertia.render('aac/id', {
      aac,
      isTerritoire,
      pmtilesUrl: env.get('PMTILES_URL', ''),
    })
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

    const { yearMin, yearMax } = await request.validateUsing(yearRangeValidator)
    if (yearMin > yearMax)
      return response.abort('yearMin ne peut pas être supérieur à yearMax', 400)

    const data = await this.aacService.getSubstances(params.installationCode, yearMin, yearMax)
    return response.json(data)
  }

  async substanceChronique({ params, request, response }: HttpContext) {
    const valid = await this.aacService.hasInstallation(params.code, params.installationCode)
    if (!valid) return response.abort('AAC ou installation introuvable', 404)

    const codeParametre = Number.parseInt(params.codeParametre, 10)
    if (Number.isNaN(codeParametre)) return response.abort('Code paramètre invalide', 400)

    const { yearMin, yearMax } = await request.validateUsing(yearRangeValidator)
    if (yearMin > yearMax)
      return response.abort('yearMin ne peut pas être supérieur à yearMax', 400)

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

    const { yearMin, yearMax } = await request.validateUsing(yearRangeValidator)
    if (yearMin > yearMax)
      return response.abort('yearMin ne peut pas être supérieur à yearMax', 400)

    const data = await this.aacService.getAnalysesPerYear(params.installationCode, yearMin, yearMax)
    return response.json(data)
  }

  async analysesStats({ params, request, response }: HttpContext) {
    const valid = await this.aacService.hasInstallation(params.code, params.installationCode)
    if (!valid) return response.abort('AAC ou installation introuvable', 404)

    const { yearMin, yearMax } = await request.validateUsing(yearRangeValidator)
    if (yearMin > yearMax)
      return response.abort('yearMin ne peut pas être supérieur à yearMax', 400)

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
