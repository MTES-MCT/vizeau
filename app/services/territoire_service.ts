import Territoire from '#models/territoire'

type TerritoireQueryOptions = {
  // Inactive territoires are excluded by default
  includeInactive?: boolean
}

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

  private queryTerritoiresForUser(
    userId: string,
    { includeInactive = false }: TerritoireQueryOptions
  ) {
    return Territoire.query()
      .whereHas('users', (usersQuery) => {
        usersQuery.where('users.id', userId)
      })
      .if(!includeInactive, (query) => query.where('isActive', true))
      .withScopes((scopes) => scopes.orderByCode())
  }

  async getTerritoiresForUser(
    userId: string,
    page: number = 1,
    perPage: number = 20,
    options: TerritoireQueryOptions = {}
  ) {
    return this.queryTerritoiresForUser(userId, options).paginate(page, perPage)
  }

  async getAllTerritoiresForUser(userId: string, options: TerritoireQueryOptions = {}) {
    return this.queryTerritoiresForUser(userId, options)
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
