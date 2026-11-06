import { toast } from 'react-toastify'
import Toast, { type ToastProps } from '~/ui/Toaster'

type ToastAlert = ToastProps['alerts'][number]

// Un même message n'est affiché qu'une fois tant qu'il est à l'écran, même après plusieurs clics.
function showToast(alert: ToastAlert) {
  const toastId = `${alert.severity}:${alert.message}`
  if (toast.isActive(toastId)) return
  toast(<Toast alerts={[alert]} />, {
    toastId,
    closeButton: false,
    style: { padding: 0, background: 'transparent', boxShadow: 'none' },
  })
}

/** Clic sur une parcelle déjà rattachée à une autre exploitation : la sélection est refusée. */
export function showUnavailableParcelleToast() {
  showToast({
    severity: 'warning',
    message:
      'Cette parcelle est déjà associée à une autre exploitation et ne peut pas être sélectionnée.',
  })
}
