import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { AacService } from '#services/aac_service'
import { TerritoireService } from '#services/territoire_service'
import TerritoireTransformer from '#transformers/territoire_transformer'

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
      territoiresInactifs: inertia.defer(async () => {
        const { territoiresInactifs } = await getTerritoires()
        return territoiresInactifs
      }, 'territoires'),
    })
  }

  private async getTerritoires(userId: string, page: number) {
    // Active territoires are paginated, inactive ones are listed apart
    const [territoiresPaginator, territoiresInactifsModels] = await Promise.all([
      this.territoireService.getTerritoiresForUser(userId, page, PER_PAGE),
      this.territoireService.getInactiveTerritoiresForUser(userId),
    ])

    const territoireModels = territoiresPaginator.all()

    // Fetch AAC data for territoires that have a code (fields live in the
    // Parquet dataset, not on the `territoires` table), in a single query.
    const aacCodes = [...territoireModels, ...territoiresInactifsModels]
      .map((territoire) => territoire.code)
      .filter((code): code is string => code !== null)
    const aacByCode = await this.aacService.getSummariesByCode(aacCodes)

    const territoires = TerritoireTransformer.transform(territoireModels, aacByCode).useVariant(
      'forAac'
    )
    const territoiresInactifs = TerritoireTransformer.transform(
      territoiresInactifsModels,
      aacByCode
    ).useVariant('forAac')

    return { territoires, territoiresInactifs, meta: territoiresPaginator.getMeta() }
  }
}
