import Territoire from '#models/territoire'

export class TerritoireService {
  async createTerritoire(name: string) {
    const trimmedName = name.trim()

    if (!trimmedName) {
      throw new Error('Territoire name cannot be empty')
    }

    return Territoire.create({
      name: trimmedName,
      code: null,
      parentTerritoireId: null,
    })
  }
}
