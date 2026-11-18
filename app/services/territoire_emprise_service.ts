import { inject } from '@adonisjs/core'
import { AacService } from '#services/aac_service'
import { TerritoireService } from '#services/territoire_service'

@inject()
export class TerritoireEmpriseService {
  constructor(
    protected territoireService: TerritoireService,
    protected aacService: AacService
  ) {}

  /*
   * Territoires actifs de l'utilisateur et emprise de leur AAC, pour centrer une carte
   * de sélection des parcelles.
   */
  async getTerritoiresWithEmprises(userId: string) {
    const territoires = await this.territoireService.getAllTerritoiresForUser(userId)
    const aacCodes = territoires
      .map((territoire) => territoire.code)
      .filter((code): code is string => code !== null)
    const emprisesByCode = await this.aacService.getEmprisesByCode(aacCodes)

    return { territoires, emprisesByCode }
  }
}
