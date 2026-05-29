import { Head } from '@inertiajs/react'

import Layout from '~/ui/layouts/layout'
import { router } from '@inertiajs/react'

import { fr } from '@codegouvfr/react-dsfr'
import { Button } from '@codegouvfr/react-dsfr/Button'

import { InferPageProps } from '@adonisjs/inertia/types'
import ProjectsController from '#controllers/projects_controller'
import EmptyPlaceholder from '~/ui/EmptyPlaceholder'
import ProjetsTabs from '~/components/projets/projets-tabs'

export default function Projets({
  projets,
  projetsCount,
  meta,
  queryString,
  availableActionTypes,
  availableYearRange,
  statusCounts,
}: InferPageProps<ProjectsController, 'index'>) {
  return (
    <Layout>
      <Head title="Projets" />
      <div
        className="fr-p-2w"
        style={{ backgroundColor: fr.colors.decisions.background.alt.blueFrance.default }}
      >
        <div className="fr-container flex justify-between items-center">
          <div>
            <div className="fr-h6 fr-mb-0">Projets</div>
          </div>
          {projetsCount > 0 && (
            <div className="flex items-center">
              <Button iconId="fr-icon-add-line" linkProps={{ href: '/projets/creation' }}>
                Nouveau projet
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="fr-container fr-mt-4w fr-mb-4w flex flex-col flex-1">
        {projetsCount === 0 ? (
          <EmptyPlaceholder
            priority="primary"
            label="Aucun projet créé"
            hint="Fonctionnalité à venir"
            size="lg"
            illustrativeIcon="fr-icon-briefcase-line"
            buttonLabel="Créer un premier projet"
            buttonIcon="fr-icon-add-line"
            handleClick={() => router.visit('/projets/creation')}
            isDisabled
          />
        ) : (
          <ProjetsTabs
            projets={projets}
            meta={meta}
            queryString={queryString}
            availableActionTypes={availableActionTypes}
            availableYearRange={availableYearRange}
            statusCounts={statusCounts}
          />
        )}
      </div>
    </Layout>
  )
}
