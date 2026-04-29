import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { ExploitationService } from '#services/exploitation_service'
import { ExploitationDto } from '../dto/exploitation_dto.js'
import { AacService } from '#services/aac_service'
import env from '#start/env'

const INSTALLATIONS_PER_PAGE = 20

@inject()
export default class ProjetsController {
  constructor(
    public exploitationService: ExploitationService,
    public aacService: AacService
  ) {}

  async create({ request, inertia, auth }: HttpContext) {
    const user = auth.getUserOrFail()

    const pageInput = request.input('installationsPage') || '1'
    const rechercheInput = request.input('installationsRecherche')
    const actifOnlyInput = request.input('showActifOnly')

    const page = Math.max(1, Number.parseInt(pageInput, 10) || 1)
    const recherche = rechercheInput || undefined
    const actifOnly = actifOnlyInput === '1'

    const { data, total } = await this.aacService.getAllInstallationsPaginated(
      page,
      INSTALLATIONS_PER_PAGE,
      recherche,
      undefined,
      actifOnly
    )
    const lastPage = Math.max(1, Math.ceil(total / INSTALLATIONS_PER_PAGE))

    return inertia.render('projets/creation', {
      exploitations: async () => {
        const results = await this.exploitationService
          .getAllActiveExploitationsByNameOrContactName('', user.id)
          .preload('parcelles')
        return ExploitationDto.toJsonArray(results)
      },
      installations: data,
      installationsMeta: {
        total,
        perPage: INSTALLATIONS_PER_PAGE,
        currentPage: page,
        lastPage,
      },
      installationsQueryString: {
        installationsRecherche: recherche ?? '',
        installationsPage: String(page),
        showActifOnly: actifOnly ? '1' : '0',
      },
      pmtilesUrl: env.get('PMTILES_URL', ''),
      millesime: '2024',
    })
  }
}
