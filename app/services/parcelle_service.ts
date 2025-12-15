import Parcelle from '#models/parcelle'
import { ModelAttributes } from '@adonisjs/lucid/types/model'

export class ParcelleService {
  /*
   * Query a parcelle by its RPG ID. A parcelle RPG ID is unique for a given year.
   */
  queryParcelleByRpgId(rpgId: string) {
    return Parcelle.query().where('rpgId', rpgId)
  }

  async createParcelle(data: Partial<ModelAttributes<Parcelle>>) {
    return await Parcelle.create(data)
  }

  async associateParcelleToExploitation(parcelleId: string, exploitationId: string) {
    const parcelle = await Parcelle.findOrFail(parcelleId)
    parcelle.exploitationId = exploitationId
    await parcelle.save()
    return parcelle
  }

  async dissociateParcelleFromExploitation(parcelleId: string) {
    const parcelle = await Parcelle.findOrFail(parcelleId)
    parcelle.exploitationId = null
    await parcelle.save()
    return parcelle
  }
}
