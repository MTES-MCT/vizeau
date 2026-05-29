import { Head } from '@inertiajs/react'
import { InferPageProps } from '@adonisjs/inertia/types'
import { fr } from '@codegouvfr/react-dsfr'
import Breadcrumb from '@codegouvfr/react-dsfr/Breadcrumb'

import ProjectsController from '#controllers/projects_controller'
import Layout from '~/ui/layouts/layout'
import { formatDateFr } from '~/functions/date'

const STATUTS: Record<string, { label: string; iconId: string }> = {
  to_be_started: { label: 'À démarrer', iconId: 'fr-icon-flag-line' },
  current: { label: 'En cours', iconId: 'fr-icon-play-line' },
  completed: { label: 'Terminé', iconId: 'fr-icon-calendar-check-line' },
  abandoned: { label: 'Abandonné', iconId: 'fr-icon-error-line' },
}

export default function ShowProjet({ projet }: InferPageProps<ProjectsController, 'show'>) {
  const statut = STATUTS[projet.status]

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

      <div className="fr-container fr-mt-4w fr-mb-4w">
        <h1 className="fr-h3 fr-mb-1w">{projet.name}</h1>

        <div className="fr-grid-row fr-grid-row--gutters fr-mt-2w">
          <div className="fr-col-12 fr-col-md-4">
            <div className="fr-tile fr-tile--sm fr-enlarge-button">
              <div className="fr-tile__body">
                <h2 className="fr-tile__title fr-h6">Informations</h2>
                <ul className="fr-raw-list fr-mt-1w">
                  <li>
                    <span className={`fr-icon--sm ${statut.iconId} fr-mr-1w`} aria-hidden="true" />
                    <strong>Statut :</strong> {statut.label}
                  </li>
                  {projet.actionType && (
                    <li className="fr-mt-1w">
                      <span
                        className="fr-icon--sm fr-icon-information-line fr-mr-1w"
                        aria-hidden="true"
                      />
                      <strong>Type d&apos;action :</strong> {projet.actionType}
                    </li>
                  )}
                  <li className="fr-mt-1w">
                    <span className="fr-icon--sm fr-icon-time-line fr-mr-1w" aria-hidden="true" />
                    <strong>Créé le :</strong> {formatDateFr(projet.createdAt)}
                  </li>
                  {['completed', 'abandoned'].includes(projet.status) && projet.closedAt ? (
                    <li className="fr-mt-1w">
                      <span
                        className="fr-icon--sm fr-icon-calendar-check-line fr-mr-1w"
                        aria-hidden="true"
                      />
                      <strong>Clôturé le :</strong> {formatDateFr(projet.closedAt)}
                    </li>
                  ) : (
                    <li className="fr-mt-1w">
                      <span
                        className="fr-icon--sm fr-icon-refresh-line fr-mr-1w"
                        aria-hidden="true"
                      />
                      <strong>Mis à jour le :</strong> {formatDateFr(projet.updatedAt)}
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {projet.description && (
            <div className="fr-col-12 fr-col-md-8">
              <div className="fr-tile fr-tile--sm">
                <div className="fr-tile__body">
                  <h2 className="fr-tile__title fr-h6">Description</h2>
                  <p className="fr-mt-1w">{projet.description}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
