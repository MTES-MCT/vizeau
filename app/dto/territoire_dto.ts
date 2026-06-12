import { TerritoireJson, PaginatedJson } from '../../types/models.js'
import Territoire from '#models/territoire'
import { ModelPaginatorContract } from '@adonisjs/lucid/types/model'

export class TerritoireDto {
  static fromModel(territoire: Territoire | any): TerritoireJson {
    // Cast to any to access properties that may come from specific queries
    const ter = territoire as any
    return {
      id: ter.id,
      nom: ter.nom ?? ter.name ?? 'Territoire sans nom',
      code: ter.code,
      typeLabel: ter.code ? 'AAC Sandre' : 'Autre territoire',
      aacHref: ter.code ? `/aac/${ter.code}` : null,
      surface: ter.surface ?? null,
      nb_captages_actifs: ter.nb_captages_actifs ?? null,
      nb_communes: ter.nb_communes ?? null,
      date_maj: ter.date_maj ?? null,
      date_creation: ter.date_creation ?? null,
      bbox: ter.bbox ?? null,
      communes: ter.communes ?? null,
      nb_parcelles: ter.nb_parcelles ?? null,
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
