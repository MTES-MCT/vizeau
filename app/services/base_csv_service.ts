import { DateTime } from 'luxon'

const SEPARATOR = ';'
const LINE_END = '\r\n'
const BOM = '\uFEFF'

export abstract class BaseCsvService<T> {
  protected abstract getHeaders(): string[]
  protected abstract buildRow(item: T): string

  generateCsv(items: T[]): string {
    const rows = [
      this.getHeaders()
        .map((h) => this.escapeField(h))
        .join(SEPARATOR),
      ...items.map((item) => this.buildRow(item)),
    ]

    return BOM + rows.join(LINE_END)
  }

  protected buildRowFromFields(fields: (string | null | undefined)[]): string {
    return fields.map((f) => this.escapeField(f)).join(SEPARATOR)
  }

  protected escapeField(value: string | null | undefined): string {
    const str = value ?? ''
    const safeStr = /^\s*[=+\-@]/.test(str) ? `'${str}` : str
    return `"${safeStr.replace(/"/g, '""')}"`
  }

  protected formatDate(date: DateTime | null | undefined): string | null {
    if (!date) return null
    return date.toFormat('dd/MM/yyyy')
  }

  protected formatDateTime(date: DateTime | null | undefined): string | null {
    if (!date) return null
    return date.toFormat('dd/MM/yyyy HH:mm')
  }
}
