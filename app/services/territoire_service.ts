import Territoire from '#models/territoire'

export class TerritoireService {
  async createTerritoire(name: string) {
    const trimmedName = name.trim()

    if (!trimmedName) {
      throw new Error('Territoire name cannot be empty')
    }

    return Territoire.create({
      name: trimmedName,
    })
  }

  private queryTerritoiresForUser(userId: string) {
    return Territoire.query()
      .whereHas('users', (usersQuery) => {
        usersQuery.where('users.id', userId)
      })
      .withScopes((scopes) => scopes.orderByCode())
  }

  async getTerritoiresForUser(userId: string, page: number = 1, perPage: number = 20) {
    return this.queryTerritoiresForUser(userId).paginate(page, perPage)
  }

  async getAllTerritoiresForUser(userId: string) {
    return this.queryTerritoiresForUser(userId)
  }

  /**
   * Return true if at least one of the given territoires is inactive.
   * Exploitations cannot be assigned to (or updated on) inactive territoires.
   */
  async hasInactiveTerritoires(territoireIds: string[]) {
    if (territoireIds.length === 0) {
      return false
    }

    const inactiveTerritoire = await Territoire.query()
      .whereIn('id', territoireIds)
      .where('isActive', false)
      .first()

    return inactiveTerritoire !== null
  }
}
