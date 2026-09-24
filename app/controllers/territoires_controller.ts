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

    // Calcul partagé entre les deux props différées pour ne l'exécuter qu'une fois
    let territoiresPromise: ReturnType<typeof this.getTerritoires> | undefined
    const getTerritoires = () => (territoiresPromise ??= this.getTerritoires(user.id, page))

    return inertia.render('territoires/index', {
      territoires: inertia.defer(async () => {
        const { territoires } = await getTerritoires()
        return territoires
      }, 'territoires'),
      meta: inertia.defer(async () => {
        const { meta } = await getTerritoires()
        return meta
      }, 'territoires'),
    })
  }

  private async getTerritoires(userId: string, page: number) {
    const territoiresPaginator = await this.territoireService.getTerritoiresForUser(
      userId,
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

    return { territoires, meta: territoiresPaginator.getMeta() }
  }
}
