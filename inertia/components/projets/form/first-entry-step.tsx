import { Alert } from '@codegouvfr/react-dsfr/Alert'

export default function FirstEntryStep() {
  return (
    <div>
      <Alert
        severity="info"
        title="Fonctionnalité à venir"
        description="La possibilité d'ajouter une première étape de suivi sera disponible prochainement."
      />
    </div>
  )
}
