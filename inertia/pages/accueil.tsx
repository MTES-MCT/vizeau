import { fr } from '@codegouvfr/react-dsfr'
import Button from '@codegouvfr/react-dsfr/Button'
import { Head } from '@inertiajs/react'
import { InferPageProps } from '@adonisjs/inertia/types'
import AccueilController from '#controllers/accueil_controller'
import ExploitationsList from '~/components/exploitations/exploitations-list'
import ListItem from '~/ui/ListItem'

import Layout from '~/ui/layouts/layout'
import Timeline from '~/ui/Timeline'
import { ExploitationJson } from '../../types/models'
import EmptyPlaceholder from '~/ui/EmptyPlaceholder'

export default function Accueil({
  latestExploitations,
  latestLogEntries,
}: InferPageProps<AccueilController, 'index'>) {
  const hasLogEntries = latestLogEntries?.length > 0
  const hasExploitations = latestExploitations?.length > 0

  return (
    <Layout>
      <Head title="Accueil" />
      <div style={{ backgroundColor: fr.colors.decisions.background.alt.blueFrance.default }}>
        <div className="fr-container flex justify-between fr-my-10w">
          <div className="fr-col-6">
            <h2>Pilotage de la protection des captages</h2>
            <p style={{ marginTop: '-1em', color: fr.colors.decisions.text.mention.grey.default }}>
              Des données structurées pour agir sur la protection de la ressource en eau.
            </p>
            <p>
              <small>
                L‘application facilite l‘accès, le traitement et le partage des données liées à la
                qualité de l‘eau aux captages. Elle produit un état des lieux clair et directement
                exploitable pour la réalisation de l‘étude des dangers. Un outil simple pour appuyer
                les collectivités et services de l‘État dans la protection de la ressource en eau.
              </small>
            </p>
            <div>
              <Button
                iconId="fr-icon-map-pin-user-line"
                className="fr-m-1w"
                linkProps={{ href: '/exploitations/creation' }}
              >
                Ajouter une exploitation agricole
              </Button>
            </div>
          </div>
          <div className="fr-col-5">
            <img src="Illustration-hero.png" alt="Illustration hero" className="fr-px-6w" />
          </div>
        </div>
      </div>
      <div>
        <div className="fr-container fr-my-8w">
          <h3 className={`fr-mb-10v text-${hasLogEntries ? 'left' : 'center'}`}>
            Dernières notes de terrain ajoutées
          </h3>

          {hasLogEntries ? (
            <Timeline
              items={latestLogEntries.map((log) => ({
                content: (
                  <ListItem
                    variant="compact"
                    key={log.id}
                    title={
                      log.notes
                        ? log.notes.substring(0, 30) + (log.notes.length > 30 ? '...' : '')
                        : 'Note sans contenu'
                    }
                    tags={
                      log.tags && log.tags.length > 0
                        ? log.tags.map((tag: { name: string }) => ({ label: tag.name }))
                        : []
                    }
                    metas={[
                      {
                        content: new Date(log.createdAt).toLocaleDateString(),
                        iconId: 'fr-icon-calendar-event-line',
                      },
                      {
                        content: log.exploitation.name || 'Exploitation inconnue',
                        iconId: 'fr-icon-map-pin-user-line',
                      },
                    ]}
                    actions={[]}
                  />
                ),
              }))}
            />
          ) : (
            <EmptyPlaceholder
              size="lg"
              priority="secondary"
              label="Aucune tâche ou planification de tâches actuellement"
              hint="Pour créer votre première tâche, rendez-vous sur l’exploitation concernée"
              illustrationSrc="/placeholder-illustrations/journal-colored.png"
            />
          )}
        </div>
      </div>

      <div
        className="fr-py-10w"
        style={{ backgroundColor: fr.colors.decisions.background.alt.grey.default }}
      >
        <div className="fr-container">
          <div className="flex justify-between">
            <h3 className={`w-full fr-mb-10v text-${hasExploitations ? 'left' : 'center'}`}>
              Dernières exploitations agricoles créées
            </h3>
            {hasExploitations && (
              <div>
                <Button iconId="fr-icon-arrow-right-line" linkProps={{ href: '/exploitations' }}>
                  Consulter les exploitations agricoles
                </Button>
              </div>
            )}
          </div>

          {hasExploitations ? (
            <ExploitationsList exploitations={latestExploitations as ExploitationJson[]} />
          ) : (
            <EmptyPlaceholder
              size="lg"
              priority="secondary"
              label="Aucune exploitation agricole enregistrée"
              illustrationSrc="/placeholder-illustrations/exploitations.png"
              buttonLabel="Ajouter une première exploitation agricole"
              actionAriaLabel="Ajouter une première exploitation agricole"
              buttonIcon="fr-icon-arrow-right-line"
            />
          )}
        </div>
      </div>
    </Layout>
  )
}
