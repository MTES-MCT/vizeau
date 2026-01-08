import Parcelle from '#models/parcelle'
import { ModelAttributes } from '@adonisjs/lucid/types/model'
import db from '@adonisjs/lucid/services/db'
import { TransactionClientContract } from '@adonisjs/lucid/types/database'

export class ParcelleService {
  /*
   * Query a parcelle by its RPG ID. A parcelle RPG ID is unique for a given year.
   */
  queryParcelleByRpgId(rpgId: string, year: number, trx?: TransactionClientContract) {
    return Parcelle.query({ client: trx }).where('rpgId', rpgId).andWhere('year', year)
  }

  async createParcelle(data: Partial<ModelAttributes<Parcelle>>, trx?: TransactionClientContract) {
    return await Parcelle.create(data, { client: trx })
  }

  async syncParcellesForExploitation(
    exploitationId: string,
    year: number,
    parcellePayloads: {
      surface?: number | undefined
      cultureCode?: string | undefined
      rpgId: string
    }[]
  ) {
    // Use a transaction to ensure data integrity between dissociation and association
    await db.transaction(async (trx) => {
      try {
        // First, dissociate all parcelles currently associated with the exploitation
        await Parcelle.query({ client: trx })
          .where('exploitationId', exploitationId)
          .andWhere('year', year)
          .update({ exploitationId: null })

        for (const parcelle of parcellePayloads) {
          // Before associating, check if the parcelle already exists
          const existingParcelle = await this.queryParcelleByRpgId(
            parcelle.rpgId,
            year,
            trx
          ).first()

          if (!existingParcelle) {
            await this.createParcelle(
              {
                exploitationId,
                year,
                rpgId: parcelle.rpgId,
                surface: parcelle.surface,
                cultureCode: parcelle.cultureCode,
              },
              trx
            )
          }
          // If it exists but is already associated to another exploitation, throw an error
          else if (
            existingParcelle.exploitationId !== null &&
            existingParcelle.exploitationId !== exploitationId
          ) {
            throw new Error(
              `La parcelle ${parcelle.rpgId} est déjà assignée à une autre exploitation.`
            )
          } else {
            existingParcelle.exploitationId = exploitationId
            await existingParcelle.save()
          }
        }

        await trx.commit()
      } catch (error) {
        await trx.rollback()
        throw error
      }
    })
  }

  // Get the RPG IDs of parcelles assigned to other exploitations for the given year.
  // Maybe we'll find a better filter (by bounding box?) if this becomes a performance issue
  async getParcellesRpgIdsForOtherExploitations(
    year: number | string,
    exploitationId: string
  ): Promise<string[]> {
    const parcelles = await Parcelle.query()
      .where('year', year)
      .andWhere('exploitationId', '!=', exploitationId)
      .select('rpgId')

    return parcelles.map((parcelle) => parcelle.rpgId)
  }
}
