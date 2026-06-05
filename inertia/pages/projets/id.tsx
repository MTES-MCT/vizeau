import { Head } from '@inertiajs/react'
import { InferPageProps } from '@adonisjs/inertia/types'
import { fr } from '@codegouvfr/react-dsfr'

import ProjectsController from '#controllers/projects_controller'

import Layout from '~/ui/layouts/layout'
import TechnicalError from '@codegouvfr/react-dsfr/picto/TechnicalError'
import Breadcrumb from '@codegouvfr/react-dsfr/Breadcrumb'

export default function ShowProjet({ projet }: InferPageProps<ProjectsController, 'show'>) {
  return (
    <Layout>
      <Head title={projet.name} />
      <div
        className="fr-p-2w"
        style={{ backgroundColor: fr.colors.decisions.background.alt.blueFrance.default }}
      >
        <div className="fr-container">
          <Breadcrumb
            currentPageLabel={projet.name}
            homeLinkProps={{ href: '/accueil' }}
            segments={[{ label: 'Projets', linkProps: { href: '/projets' } }]}
            className="fr-my-0"
          />
        </div>
      </div>

      <div className="fr-container flex flex-col items-center justify-start flex-1 fr-mt-4w fr-mb-4w">
        <TechnicalError height={350} width={350} />
        <h1>Page en construction</h1>
        <h3>Un petit peu de patience !</h3>
      </div>
    </Layout>
  )
}
