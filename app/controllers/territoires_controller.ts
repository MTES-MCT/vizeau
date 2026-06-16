import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { AacService } from '#services/aac_service'
import { TerritoireService } from '#services/territoire_service'
import { AacDto, type AacSummaryJson } from '../dto/aac_dto.js'

const PER_PAGE = 20

@inject()
export default class TerritoiresController {
  constructor(
    public aacService: AacService,
    public territoireService: TerritoireService
  ) {}

  async index({ auth, request, inertia }: HttpContext) {
    const user = auth.getUserOrFail()
    const pageInput = request.input('territoiresPage') || request.input('page') || '1'
    const page = Math.max(1, Number.parseInt(pageInput, 10) || 1)

    const territoiresPaginator = await this.territoireService.getTerritoiresForUser(
      user.id,
      page,
      PER_PAGE
    )

    const rawTerritoires = territoiresPaginator.toJSON().data as any[]

    // Fetch AAC data for territoires that have a code (fields live in the
    // Parquet dataset, not on the `territoires` table).
    const aacCodes = rawTerritoires.map((t: any) => t.code).filter(Boolean) as string[]
    let aacByCode: Record<string, AacSummaryJson> = {}
    if (aacCodes.length > 0) {
      const { data } = await this.aacService.getAll(
        1,
        aacCodes.length,
        undefined,
        undefined,
        aacCodes
      )
      for (const row of data) {
        const summary = AacDto.fromRawSummary(row)
        aacByCode[summary.code] = summary
      }
    }

    const territoires = rawTerritoires.map((territoire: any) => {
      const aac = territoire.code ? aacByCode[territoire.code] : null
      return {
        id: territoire.id,
        nom: territoire.nom ?? territoire.name ?? 'Territoire sans nom',
        code: territoire.code,
        typeLabel: territoire.code ? 'AAC Sandre' : 'Autre territoire',
        aacHref: territoire.code ? `/aac/${territoire.code}` : null,
        surface: aac?.surface ?? null,
        nb_captages_actifs: aac?.nb_captages_actifs ?? null,
        nb_communes: aac?.nb_communes ?? null,
        date_maj: aac?.date_maj ?? null,
        date_creation: aac?.date_creation ?? null,
        bbox: aac?.bbox ?? null,
        communes: aac?.communes ?? null,
        nb_parcelles: aac?.nb_parcelles ?? null,
      }
    })

    return inertia.render('territoires/index', {
      territoires,
      meta: territoiresPaginator.getMeta(),
    })
  }
}
