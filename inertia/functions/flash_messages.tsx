import { toast } from 'react-toastify'
import Toast from '~/ui/Toaster'

const TOAST_SEVERITIES = ['success', 'error', 'warning', 'info'] as const

type ToastSeverity = (typeof TOAST_SEVERITIES)[number]

export type FlashMessages = Partial<
  Record<
    ToastSeverity,
    {
      message?: string
      context?: string
    } | null
  >
>

export function showFlashToasts(flashMessages?: FlashMessages) {
  const alerts = TOAST_SEVERITIES.filter(
    (severity) => flashMessages?.[severity]?.message && !flashMessages?.[severity]?.context
  ).map((severity) => ({
    severity,
    message: flashMessages?.[severity]?.message as string,
  }))

  if (alerts.length === 0) return

  const toastId = alerts.map((a) => `${a.severity}:${a.message}`).join('|')
  if (toast.isActive(toastId)) return

  toast(<Toast alerts={alerts} />, {
    toastId,
    closeButton: false,
    style: { padding: 0, background: 'transparent', boxShadow: 'none' },
  })
}
