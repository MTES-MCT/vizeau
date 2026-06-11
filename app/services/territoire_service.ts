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

  async getTerritoiresForUser(userId: string, page: number = 1, perPage: number = 20) {
    return (
      Territoire.query()
        .whereHas('users', (usersQuery) => {
          usersQuery.where('users.id', userId)
        })
        /*
          Order by code as integer if it exists, otherwise by name.
          This ensures that territoires with numeric codes are sorted in natural numeric order,
          while those without codes are sorted alphabetically by name and appear after those with codes.
         */
        .orderByRaw(
          `CASE WHEN code ~ '^[0-9]+$' THEN code::int END ASC NULLS LAST,
            code ASC NULLS LAST,
            name ASC`
        )
        .paginate(page, perPage)
    )
  }
}
