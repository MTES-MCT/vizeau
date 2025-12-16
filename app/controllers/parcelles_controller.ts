import type { HttpContext } from '@adonisjs/core/http'
import { createParcelleValidator } from '#validators/parcelle'
import { ParcelleService } from '#services/parcelle_service'
import { inject } from '@adonisjs/core'

@inject()
export default class ParcellesController {
  constructor(public parcelleService: ParcelleService) {}

  async show({ response, params }: HttpContext) {
    const rpgId = params.rpgId
    const parcelle = await this.parcelleService.queryParcelleByRpgId(rpgId).first()

    return response.json(parcelle)
  }

  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(createParcelleValidator)
    const parcelle = await this.parcelleService.createParcelle(payload)

    return response.json(parcelle)
  }

  async associateToExploitation({ request, response, params }: HttpContext) {
    const parcelleId = params.id
    const { exploitationId } = request.only(['exploitationId'])
    const parcelle = await this.parcelleService.associateParcelleToExploitation(
      parcelleId,
      exploitationId
    )

    return response.json(parcelle)
  }

  async dissociateFromExploitation({ response, params }: HttpContext) {
    const parcelleId = params.id
    const parcelle = await this.parcelleService.dissociateParcelleFromExploitation(parcelleId)

    return response.json(parcelle)
  }
}
