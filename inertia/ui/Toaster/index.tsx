import { useState } from 'react'
import uniqBy from 'lodash-es/uniqBy'
import { Alert } from '@codegouvfr/react-dsfr/Alert'
import { ToastContainer, Slide, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

export type ToasterProps = {
  alerts: { severity: 'info' | 'success' | 'error' | 'warning'; message: string }[]
}

export default function Toast({ alerts }: ToasterProps) {
  const uniqueAlert = uniqBy(alerts, 'message')
  const [updatedAlertsList, setUpdatedAlertsList] = useState(uniqueAlert)

  const handleAlertClose = (message: string) => {
    const filteredAlerts = updatedAlertsList.filter((alert) => alert.message !== message)
    setUpdatedAlertsList(filteredAlerts)
    if (filteredAlerts.length === 0) {
      toast.dismiss()
    }
  }

  return (
    <div className="fr-pt-2w w-full">
      {uniqueAlert.map(({ severity, message }) => (
        <Alert
          key={message}
          severity={severity}
          description={message}
          small
          closable
          onClose={() => handleAlertClose(message)}
        />
      ))}
    </div>
  )
}

export function Toaster({
  autoClose = 3000,
  containerId,
}: {
  autoClose?: number | false
  containerId?: string
}) {
  return (
    <ToastContainer
      position="top-center"
      hideProgressBar
      autoClose={autoClose}
      transition={Slide}
      newestOnTop={false}
      pauseOnHover
      stacked
      containerId={containerId}
      style={{ minWidth: '380px' }}
    />
  )
}
