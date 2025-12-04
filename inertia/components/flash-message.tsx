import Notice, { NoticeProps } from '@codegouvfr/react-dsfr/Notice'
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
  let severity: NoticeProps.Severity

  switch (type) {
    case 'error':
      severity = 'alert'
      break
    case 'warning':
      severity = 'warning'
      break
    default:
      severity = 'info'
  }

  return <Notice severity={severity} title={message} description={description} isClosable={true} />
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
