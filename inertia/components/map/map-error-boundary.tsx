import type { PropsWithChildren } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import Alert from '@codegouvfr/react-dsfr/Alert'

function MapErrorFallback() {
  return (
    <Alert
      severity={'error'}
      title={"Impossible d'afficher la carte"}
      description={
        <p>
          La carte n'a pas pu être initialisée. Cela peut être causé par des paramètres de votre
          navigateur. <br />
          Veuillez réessayer plus tard.
        </p>
      }
    />
  )
}

export function MapErrorBoundary({ children }: PropsWithChildren) {
  return <ErrorBoundary FallbackComponent={MapErrorFallback}>{children}</ErrorBoundary>
}
