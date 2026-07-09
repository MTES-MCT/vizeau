import { Head } from '@inertiajs/react'

import Layout from '~/ui/layouts/layout'
import { Alert } from '@codegouvfr/react-dsfr/Alert'

export default function NoTerritoire() {
  return (
    <Layout>
      <Head title="Aucune zone de captage n'est attachée à votre compte" />
      <div>
        <div className="fr-container flex justify-between fr-my-10w">
          <Alert
            title="Aucune zone de captage n'est attachée à votre compte"
            severity="error"
            description="Votre compte n'a pas été correctement configuré par l'équipe d'administration. Veuillez contacter le support."
          />
        </div>
      </div>
    </Layout>
  )
}
