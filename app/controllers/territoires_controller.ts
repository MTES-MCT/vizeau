import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { AacService } from '#services/aac_service'
import type { AacJson } from '../../types/aac.js'

const PER_PAGE = 20

@inject()
export default class TerritoiresController {
  constructor(public aacService: AacService) {}

  async index({ auth, request, inertia }: HttpContext) {
    const user = auth.getUserOrFail()
    const pageInput = request.input('territoiresPage') || request.input('page') || '1'
    const page = Math.max(1, Number.parseInt(pageInput, 10) || 1)

    const territoiresPaginator = await user
      .related('territoires')
      .query()
      .orderByRaw('name IS NULL, name ASC')
      .paginate(page, PER_PAGE)

    const rawTerritoires = territoiresPaginator.toJSON().data as any[]

    // Fetch AAC data (surface, nb_communes) for territoires that have a code
    const aacCodes = rawTerritoires.map((t: any) => t.code).filter(Boolean) as string[]
    let aacByCode: Record<string, { surface: number; nb_communes: number }> = {}
    if (aacCodes.length > 0) {
      const { data } = await this.aacService.getAll(
        1,
        aacCodes.length,
        undefined,
        undefined,
        aacCodes
      )
      for (const row of data) {
        const code = row.code as string
        const communes = row.communes as AacJson['communes'] | null
        aacByCode[code] = {
          surface: row.surface as number,
          nb_communes: communes?.nb_communes ?? 0,
        }
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
        nb_captages_actifs: territoire.nb_captages_actifs ?? null,
        nb_communes: aac?.nb_communes ?? null,
        date_maj: territoire.date_maj ?? null,
        date_creation: territoire.date_creation ?? null,
        bbox: territoire.bbox ?? null,
        communes: territoire.communes ?? null,
        nb_parcelles: territoire.nb_parcelles ?? null,
      }
    })

    return inertia.render('territoires/index', {
      territoires,
      meta: territoiresPaginator.getMeta(),
    })
  }
}
