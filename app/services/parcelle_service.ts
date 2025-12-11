import Parcelle from '#models/parcelle'
import { ModelAttributes } from '@adonisjs/lucid/types/model'

export class ParcelleService {
  /*
   * Query a parcelle by its RPG ID. A parcelle RPG ID is unique for a given year.
   * Use this query to get the stable parcelle physique ID.
   */
  queryParcelleByRpgId(rpgId: string) {
    return Parcelle.query().where('rpgId', rpgId)
  }

  /*
   * From an RPG ID, query the history of parcelles linked to the same parcelle physique ID.
   */
  async queryHistoryForParcelle(rpgId: string) {
    const currentParcelle = await this.queryParcelleByRpgId(rpgId)
      .select('parcelle_physique_id')
      .firstOrFail()

    return Parcelle.query()
      .where('parcelle_physique_id', currentParcelle.parcellePhysiqueId)
      .orderBy('year', 'desc')
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
