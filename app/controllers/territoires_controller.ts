import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { AacService } from '#services/aac_service'
import { TerritoireService } from '#services/territoire_service'
import TerritoireTransformer from '#transformers/territoire_transformer'
import type Territoire from '#models/territoire'

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
    let territoiresPromise: ReturnType<typeof this.getTerritoiresActifs> | undefined
    const getTerritoires = () => (territoiresPromise ??= this.getTerritoiresActifs(user.id, page))

    return inertia.render('territoires/index', {
      territoires: inertia.defer(async () => {
        const { territoires } = await getTerritoires()
        return territoires
      }, 'territoires'),
      meta: inertia.defer(async () => {
        const { meta } = await getTerritoires()
        return meta
      }, 'territoires'),
      // Indépendant de la pagination : mis en cache côté client pour ne pas
      // être recalculé à chaque changement de page
      territoiresInactifs: inertia
        .defer(() => this.getTerritoiresInactifs(user.id), 'territoiresInactifs')
        .once(),
    })
  }

  private async getTerritoiresActifs(userId: string, page: number) {
    const territoiresPaginator = await this.territoireService.getTerritoiresForUser(
      userId,
      page,
      PER_PAGE
    )
    const territoires = await this.transformWithAac(territoiresPaginator.all())

    return { territoires, meta: territoiresPaginator.getMeta() }
  }

  private async getTerritoiresInactifs(userId: string) {
    // Not paginated: a user only has a handful of them
    const territoiresInactifs = await this.territoireService.getAllTerritoiresForUser(userId, {
      status: 'inactive',
    })

    return this.transformWithAac(territoiresInactifs)
  }

  private async transformWithAac(territoires: Territoire[]) {
    // Fetch AAC data for territoires that have a code (fields live in the
    // Parquet dataset, not on the `territoires` table), in a single query.
    const aacCodes = territoires
      .map((territoire) => territoire.code)
      .filter((code): code is string => code !== null)
    const aacByCode = await this.aacService.getSummariesByCode(aacCodes)

    return TerritoireTransformer.transform(territoires, aacByCode).useVariant('forAac')
  }
}
