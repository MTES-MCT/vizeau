export type FlashMessageType = 'success' | 'error' | 'warning' | 'info'

export type FlashMessageValue = {
  message: string
  description?: string
  code?: string
  details?: Record<string, any>
  context?: string // Ajout du contexte (ex: 'parcelle', 'journal', etc.)
}
