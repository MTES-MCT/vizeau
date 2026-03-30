import { Head } from '@inertiajs/react'
import { InferPageProps } from '@adonisjs/inertia/types'
import AccueilController from '#controllers/accueil_controller'

import Layout from '~/ui/layouts/layout'
import { Alert } from '@codegouvfr/react-dsfr/Alert'

export default function NoTerritoire({}: InferPageProps<AccueilController, 'noTerritoire'>) {
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
