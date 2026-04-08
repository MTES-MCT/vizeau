import { DateTime } from 'luxon'
import LogEntry from '#models/log_entry'

const SEPARATOR = ';'
const LINE_END = '\r\n'
const BOM = '\uFEFF'

const HEADERS = [
  'Date',
  'Titre',
  'Notes',
  'Auteur',
  'Statut',
  'Étiquettes',
  'Créé le',
  'Modifié le',
]

export class LogEntryCsvService {
  /**
   * Génère une chaîne CSV (avec BOM UTF-8) à partir d'une liste d'entrées de journal.
   * Les relations author, tags et documents doivent être préchargées.
   */
  generateCsv(entries: LogEntry[]): string {
    const rows = [
      HEADERS.map((h) => this.escapeField(h)).join(SEPARATOR),
      ...entries.map((entry) => this.buildRow(entry)),
    ]

    return BOM + rows.join(LINE_END)
  }

  private buildRow(entry: LogEntry): string {
    const fields = [
      this.formatDate(entry.date),
      entry.title,
      entry.notes,
      entry.author?.fullName ?? entry.author?.email ?? null,
      entry.isCompleted ? 'Effectuée' : 'Non effectuée',
      entry.tags?.map((t) => t.name).join(' | ') ?? null,
      this.formatDateTime(entry.createdAt),
      this.formatDateTime(entry.updatedAt),
    ]

    return fields.map((f) => this.escapeField(f)).join(SEPARATOR)
  }

  private escapeField(value: string | null | undefined): string {
    // Ensures the value is a string
    const str = value ?? ''
    // Protect against CSV injection by prefixing dangerous characters with a single quote
    const safeStr = /^\s*[=+\-@]/.test(str) ? `'${str}` : str
    // Wrap in double quotes and escape inner double quotes by doubling them
    return `"${safeStr.replace(/"/g, '""')}"`
  }

  private formatDate(date: DateTime | null | undefined): string | null {
    if (!date) return null
    return date.toFormat('dd/MM/yyyy')
  }

  private formatDateTime(date: DateTime | null | undefined): string | null {
    if (!date) return null
    return date.toFormat('dd/MM/yyyy HH:mm')
  }
}
