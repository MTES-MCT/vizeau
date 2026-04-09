import LogEntry from '#models/log_entry'
import { BaseCsvService } from '#services/base_csv_service'

export class LogEntryCsvService extends BaseCsvService<LogEntry> {
  protected getHeaders(): string[] {
    return ['Date', 'Titre', 'Notes', 'Auteur', 'Statut', 'Étiquettes', 'Créé le', 'Modifié le']
  }

  protected buildRow(entry: LogEntry): string {
    return this.buildRowFromFields([
      this.formatDate(entry.date),
      entry.title,
      entry.notes,
      entry.author?.fullName ?? entry.author?.email ?? null,
      entry.isCompleted ? 'Effectuée' : 'Non effectuée',
      entry.tags?.map((t) => t.name).join(' | ') ?? null,
      this.formatDateTime(entry.createdAt),
      this.formatDateTime(entry.updatedAt),
    ])
  }
}
