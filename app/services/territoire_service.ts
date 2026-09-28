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
}
