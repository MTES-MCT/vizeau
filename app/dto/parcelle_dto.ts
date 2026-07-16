import { type ParcelleJson } from '#types/models'
import type Parcelle from '#models/parcelle'

export class ParcelleDto {
  /*
   * The `comments` relation, when preloaded, must be scoped by the caller to the comment
   * of a single user (typically the current user) so that `comments[0]` is that user's comment.
   */
  static fromModel(parcelle: Parcelle): ParcelleJson {
    return {
      id: parcelle.id,
      exploitationId: parcelle.exploitationId,
      year: parcelle.year,
      rpgId: parcelle.rpgId,
      surface: parcelle.surface,
      cultureCode: parcelle.cultureCode,
      centroid: parcelle.centroid,
      comment: parcelle.comments?.[0]?.comment ?? null,
    }
  }
}
