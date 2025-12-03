import { Alert, AlertProps } from '@codegouvfr/react-dsfr/Alert'
import { FlashMessageType, FlashMessageValue } from '../../types/flash_messages'

export function FlashMessage({
  type,
  message,
  description,
}: {
  type: string
  message: string
  description?: string
}) {
  let severity: AlertProps.Severity

  switch (type) {
    case 'success':
      severity = 'success'
      break
    case 'error':
      severity = 'error'
      break
    case 'warning':
      severity = 'warning'
      break
    default:
      severity = 'info'
  }

  return (
    <Alert
      severity={severity}
      title={message}
      description={description || ''}
      closable={true}
      small={true}
    />
  )
}

export function FlashMessages({
  flashMessages,
}: {
  flashMessages: Record<FlashMessageType, FlashMessageValue>
}) {
  return (
    <>
      {Object.entries(flashMessages).map(([type, fm], i) => (
        <FlashMessage
          type={type}
          message={fm.message}
          description={fm.description}
          key={`fm-${i}`}
        />
      ))}
    </>
  )
}
