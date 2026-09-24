import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { AacService } from '#services/aac_service'
import { TerritoireService } from '#services/territoire_service'
import { TerritoireDto } from '../dto/territoire_dto.js'

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
    const aacByCode = await this.aacService.getSummariesByCode(aacCodes)

    const territoires = rawTerritoires.map((territoire: any) =>
      TerritoireDto.fromModel(territoire, territoire.code ? aacByCode[territoire.code] : null)
    )

    return inertia.render('territoires/index', {
      territoires,
      meta: territoiresPaginator.getMeta(),
    })
  }
}
