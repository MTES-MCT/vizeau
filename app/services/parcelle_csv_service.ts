import Parcelle from '#models/parcelle'
import { BaseCsvService } from '#services/base_csv_service'

export class ParcelleCsvService extends BaseCsvService<Parcelle> {
  protected getHeaders(): string[] {
    return [
      'Année',
      'Identifiant RPG',
      'Surface (ha)',
      'Code culture',
      'Culture',
      'Commentaire',
      'Créé le',
      'Modifié le',
    ]
  }

  protected buildRow(parcelle: Parcelle): string {
    return this.buildRowFromFields([
      parcelle.year?.toString() ?? null,
      parcelle.rpgId,
      parcelle.surface?.toString() ?? null,
      parcelle.cultureCode,
      parcelle.culture?.label ?? null,
      parcelle.comment,
      this.formatDateTime(parcelle.createdAt),
      this.formatDateTime(parcelle.updatedAt),
    ])
  }
}
