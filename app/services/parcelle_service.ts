import Parcelle from '#models/parcelle'
import { type ModelAttributes } from '@adonisjs/lucid/types/model'
import db from '@adonisjs/lucid/services/db'
import { type TransactionClientContract } from '@adonisjs/lucid/types/database'

export type ParcellePayload = {
  rpgId: string
  surface?: number | undefined
  cultureCode?: string | undefined
  centroid?: { x: number; y: number } | undefined
}

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
    parcellePayloads: ParcellePayload[]
  ) {
    // Use a transaction to ensure data integrity between dissociation and association
    await db.transaction((trx) => this.syncYear(trx, exploitationId, year, parcellePayloads))
  }

  /*
   * Synchronise les parcelles d'une exploitation, tous millésimes confondus : un millésime absent
   * de la liste perd toutes ses parcelles. Seuls les millésimes modifiés sont réécrits.
   */
  async syncAllParcellesForExploitation(
    exploitationId: string,
    parcellePayloads: (ParcellePayload & { year: number })[]
  ) {
    const requestedByYear = new Map<number, ParcellePayload[]>()
    for (const { year, ...parcelle } of parcellePayloads) {
      requestedByYear.set(year, [...(requestedByYear.get(year) ?? []), parcelle])
    }

    const existingParcelles = await Parcelle.query()
      .where('exploitationId', exploitationId)
      .select('year', 'rpgId')
    const existingByYear = new Map<number, Set<string | null>>()
    for (const { year, rpgId } of existingParcelles) {
      existingByYear.set(year, (existingByYear.get(year) ?? new Set()).add(rpgId))
    }

    const years = new Set([...requestedByYear.keys(), ...existingByYear.keys()])
    const changedYears = [...years].filter((year) => {
      const requestedIds = new Set((requestedByYear.get(year) ?? []).map(({ rpgId }) => rpgId))
      const existingIds = existingByYear.get(year) ?? new Set()
      return (
        requestedIds.size !== existingIds.size ||
        [...requestedIds].some((id) => !existingIds.has(id))
      )
    })

    if (changedYears.length === 0) return

    await db.transaction(async (trx) => {
      for (const year of changedYears) {
        await this.syncYear(trx, exploitationId, year, requestedByYear.get(year) ?? [])
      }
    })
  }

  private async syncYear(
    trx: TransactionClientContract,
    exploitationId: string,
    year: number,
    parcellePayloads: ParcellePayload[]
  ) {
    // First, dissociate all parcelles currently associated with the exploitation
    await Parcelle.query({ client: trx })
      .where('exploitationId', exploitationId)
      .andWhere('year', year)
      .update({ exploitationId: null })

    for (const parcelle of parcellePayloads) {
      // Before associating, check if the parcelle already exists
      const existingParcelle = await this.queryParcelleByRpgId(parcelle.rpgId, year, trx).first()

      if (!existingParcelle) {
        await this.createParcelle(
          {
            exploitationId,
            year,
            rpgId: parcelle.rpgId,
            surface: parcelle.surface?.toString(),
            cultureCode: parcelle.cultureCode,
            centroid: parcelle.centroid,
          },
          trx
        )
      }
      // If it exists but is already associated to another exploitation, throw an error
      else if (
        existingParcelle.exploitationId !== null &&
        existingParcelle.exploitationId !== exploitationId
      ) {
        throw new Error(`La parcelle ${parcelle.rpgId} est déjà assignée à une autre exploitation.`)
      } else {
        existingParcelle.exploitationId = exploitationId
        await existingParcelle.save()
      }
    }
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
      .andWhereNotNull('rpgId')
      .select('rpgId')

    return parcelles.map((parcelle) => parcelle.rpgId!)
  }

  async getAllParcellesForExploitation(
    exploitationId: string,
    commentsForUserId?: string
  ): Promise<Parcelle[]> {
    return Parcelle.query()
      .where('exploitationId', exploitationId)
      .preload('culture')
      .if(commentsForUserId, (query) => {
        query.preload('comments', (commentQuery) => {
          commentQuery.where('userId', commentsForUserId!)
        })
      })
      .orderBy('year', 'desc')
      .orderBy('rpgId', 'asc')
  }

  async detachParcelleFromExploitation(exploitationId: string, rpgId: string, year: number) {
    const parcelle = await this.queryParcelleByRpgId(rpgId, year).first()

    if (!parcelle) {
      throw new Error(`La parcelle ${rpgId} n'existe pas pour l'année ${year}.`)
    }

    if (parcelle.exploitationId !== exploitationId) {
      throw new Error(`La parcelle ${rpgId} n'est pas associée à l'exploitation demandée.`)
    }

    parcelle.exploitationId = null
    await parcelle.save()

    return parcelle
  }

  async getParcelleForExploitation(
    exploitationId: string,
    rpgId: string,
    year: number
  ): Promise<Parcelle | null> {
    return await Parcelle.query()
      .where('rpgId', rpgId)
      .andWhere('year', year)
      .andWhere('exploitationId', exploitationId)
      .first()
  }
}
