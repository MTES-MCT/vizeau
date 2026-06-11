import { TerritoireJson, PaginatedJson } from '#types/models'
import Territoire from '#models/territoire'
import { ModelPaginatorContract } from '@adonisjs/lucid/types/model'

export class TerritoireDto {
  static fromModel(territoire: Territoire): TerritoireJson {
    return {
      id: territoire.id,
      name: territoire.name,
      code: territoire.code,
    }
  }

  static fromArray(territoires: Territoire[]): TerritoireJson[] {
    return territoires.map(TerritoireDto.fromModel)
  }

  static fromPaginator(
    paginatedTerritoires: ModelPaginatorContract<Territoire>
  ): PaginatedJson<TerritoireJson> {
    const transformedData = (paginatedTerritoires.toJSON().data as Territoire[]).map(
      TerritoireDto.fromModel
    )

    return {
      meta: paginatedTerritoires.getMeta(),
      data: transformedData,
    }
  }
}
