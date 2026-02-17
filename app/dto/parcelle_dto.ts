import { ParcelleJson } from '../../types/models.js'
import Parcelle from '#models/parcelle'

export class ParcelleDto {
  static fromModel(parcelle: Parcelle): ParcelleJson {
    return {
      id: parcelle.id,
      exploitationId: parcelle.exploitationId,
      year: parcelle.year,
      rpgId: parcelle.rpgId,
      surface: parcelle.surface,
      cultureCode: parcelle.cultureCode,
      centroid: parcelle.centroid,
    }
  }
}
