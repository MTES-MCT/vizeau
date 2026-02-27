import { useRef, useState } from 'react'
import Notice, { NoticeProps } from '@codegouvfr/react-dsfr/Notice'
import { FlashMessageType, FlashMessageValue } from '../../types/flash_messages'

export function FlashMessage({
  type,
  message,
  description,
  handleDismiss,
}: {
  type: string
  message: string
  description?: string
  handleDismiss?: () => void
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

  return (
    <Notice
      severity={severity}
      title={message}
      description={description}
      isClosable={true}
      onClose={handleDismiss}
    />
  )
}

// Persiste les messages fermés entre les remontages (changement d'onglet),
// mais se réinitialise quand de nouveaux messages arrivent du serveur.
const globalDismissed = {
  forFlashMessages: null as Record<FlashMessageType, FlashMessageValue | null> | null,
  keys: new Set<string>(),
}

export function FlashMessages({
  flashMessages,
  context,
}: {
  flashMessages: Record<FlashMessageType, FlashMessageValue | null>
  context?: string
}) {
  const [dismissedMessages, setDismissedMessages] = useState(() => {
    // Au remontage (ex: changement d'onglet), restaure l'état si c'est la même page
    if (globalDismissed.forFlashMessages === flashMessages) {
      return globalDismissed.keys
    }

    globalDismissed.forFlashMessages = flashMessages
    globalDismissed.keys = new Set()
    return globalDismissed.keys
  })

  const prevRef = useRef(flashMessages)

  // Nouvelle réponse serveur → réinitialise les messages fermés
  if (prevRef.current !== flashMessages) {
    prevRef.current = flashMessages
    const fresh = new Set<string>()
    globalDismissed.forFlashMessages = flashMessages
    globalDismissed.keys = fresh
    setDismissedMessages(fresh)
  }

  const handleDismiss = (key: string) => {
    setDismissedMessages((prev) => {
      const next = new Set([...prev, key])
      globalDismissed.keys = next
      return next
    })
  }

  return (
    <>
      {Object.entries(flashMessages).map(([type, fm]) => {
        if (!fm) return null
        if (context && fm.context !== context) return null
        const key = `${type}:${fm.message}`
        if (dismissedMessages.has(key)) return null
        return (
          <div key={key}>
            <FlashMessage
              type={type}
              message={fm?.message || ''}
              description={fm?.description || ''}
              handleDismiss={() => handleDismiss(key)}
            />
          </div>
        )
      })}
    </>
  )
}
