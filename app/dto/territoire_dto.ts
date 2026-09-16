import { type TerritoireJson, type PaginatedJson } from '#types/models'
import type Territoire from '#models/territoire'
import { type ModelPaginatorContract } from '@adonisjs/lucid/types/model'
import type { AacSummaryJson } from './aac_dto.js'

export class TerritoireDto {
  static fromModel(
    territoire: Territoire | any,
    aacSummary?: AacSummaryJson | null
  ): TerritoireJson {
    // Cast to any to access properties that may come from specific queries
    const ter = territoire as any
    return {
      id: ter.id,
      nom: ter.nom ?? ter.name ?? 'Territoire sans nom',
      code: ter.code,
      typeLabel: ter.code ? 'AAC Sandre' : 'Autre territoire',
      aacHref: ter.code ? `/aac/${ter.code}` : null,
      surface: aacSummary?.surface ?? ter.surface ?? null,
      nb_captages_actifs: aacSummary?.nb_captages_actifs ?? ter.nb_captages_actifs ?? null,
      nb_communes: aacSummary?.nb_communes ?? ter.nb_communes ?? null,
      date_maj: aacSummary?.date_maj ?? ter.date_maj ?? null,
      date_creation: aacSummary?.date_creation ?? ter.date_creation ?? null,
      bbox: aacSummary?.bbox ?? ter.bbox ?? null,
      communes: aacSummary?.communes ?? ter.communes ?? null,
      nb_parcelles: aacSummary?.nb_parcelles ?? ter.nb_parcelles ?? null,
      depassements_alerte: aacSummary?.depassements_alerte ?? ter.depassements_alerte ?? null,
      depassements_reglementaires:
        aacSummary?.depassements_reglementaires ?? ter.depassements_reglementaires ?? null,
    }
  }

  static fromArray(territoires: Territoire[]): TerritoireJson[] {
    return territoires.map((territoire) => TerritoireDto.fromModel(territoire))
  }

  static fromPaginator(
    paginatedTerritoires: ModelPaginatorContract<Territoire>
  ): PaginatedJson<TerritoireJson> {
    const transformedData = (paginatedTerritoires.toJSON().data as Territoire[]).map((territoire) =>
      TerritoireDto.fromModel(territoire)
    )

    return {
      meta: paginatedTerritoires.getMeta(),
      data: transformedData,
    }
  }
}
