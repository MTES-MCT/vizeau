import { BaseTransformer } from '@adonisjs/core/transformers'
import { toISODateTime } from '../helpers/date.js'
import type Territoire from '#models/territoire'
import type { AacSummaryJson } from '../dto/aac_dto.js'
import ExploitationTransformer from '#transformers/exploitation_transformer'
import ProjectTransformer from '#transformers/project_transformer'
import UserTransformer from '#transformers/user_transformer'

export default class TerritoireTransformer extends BaseTransformer<Territoire> {
  /*
   * AAC data indexed by AAC code, only used by the forAac and forEmprise variants.
   * AAC data lives in the Parquet dataset, not on the territoires table.
   * Partiel : forEmprise n'a besoin que de la bbox.
   */
  constructor(
    resource: Territoire,
    protected aacSummariesByCode: Record<string, Partial<AacSummaryJson> | undefined> = {}
  ) {
    super(resource)
  }

  toObject() {
    return {
      ...this.pick(this.resource, ['id', 'code', 'name', 'isActive', 'parentTerritoireId']),
      createdAt: toISODateTime(this.resource.createdAt),
      updatedAt: toISODateTime(this.resource.updatedAt),
      parentTerritoire: TerritoireTransformer.transform(
        this.whenLoaded(this.resource.parentTerritoire)
      ),
      subTerritoires: TerritoireTransformer.transform(
        this.whenLoaded(this.resource.subTerritoires)
      ),
      exploitations: ExploitationTransformer.transform(
        this.whenLoaded(this.resource.exploitations)
      ),
      users: UserTransformer.transform(this.whenLoaded(this.resource.users)),
      projects: ProjectTransformer.transform(this.whenLoaded(this.resource.projects)),
    }
  }

  /*
   * Territoire enriched with the summary of its AAC. AAC fields are null when the
   * territoire has no code or when its AAC is missing from the dataset.
   */
  forAac() {
    const aac = this.resource.code ? this.aacSummariesByCode[this.resource.code] : undefined

    return {
      ...this.toObject(),
      surface: aac?.surface ?? null,
      nb_captages_actifs: aac?.nb_captages_actifs ?? null,
      nb_communes: aac?.nb_communes ?? null,
      date_maj: aac?.date_maj ?? null,
      date_creation: aac?.date_creation ?? null,
      bbox: aac?.bbox ?? null,
      communes: aac?.communes ?? null,
      nb_parcelles: aac?.nb_parcelles ?? null,
      depassements_alerte: aac?.depassements_alerte ?? null,
      depassements_reglementaires: aac?.depassements_reglementaires ?? null,
    }
  }

  /*
   * Territoire réduit à l'emprise (bbox) de son AAC, pour centrer une carte.
   * bbox vaut null si le territoire n'a pas de code ou si son AAC est absente du jeu de données.
   */
  forEmprise() {
    const aac = this.resource.code ? this.aacSummariesByCode[this.resource.code] : undefined

    return {
      ...this.pick(this.resource, ['id', 'code', 'name']),
      bbox: aac?.bbox ?? null,
    }
  }
}
