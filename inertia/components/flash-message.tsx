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
  flashMessages: Record<FlashMessageType, FlashMessageValue | null>
}) {
  return (
    <>
      {Object.entries(flashMessages).map(([type, fm], i) => {
        // Log an error if the flash message is null or undefined, but continue rendering the other messages
        if (!fm) {
          return null
        }
        return (
          <FlashMessage
            type={type}
            message={fm?.message || ''}
            description={fm?.description || ''}
            key={`fm-${i}`}
          />
        )
      })}
    </>
  )
}
