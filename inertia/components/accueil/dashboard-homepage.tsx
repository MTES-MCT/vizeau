import Button from '@codegouvfr/react-dsfr/Button'
import { router } from '@inertiajs/react'
import { urlFor } from '~/client'

import ExploitationsList from '~/components/exploitations/exploitations-list'
import ListItem from '~/ui/ListItem'

import Timeline from '~/ui/Timeline'
import EmptyPlaceholder from '~/ui/EmptyPlaceholder'
import { getLogEntryTitle } from '~/functions/log_entries'
import HomeSection from '~/ui/HomeSection'
import Hero from '~/components/accueil/hero'

export type DashboardHomepageProps = {
  latestExploitations: any[]
  latestLogEntries: any[]
}

export default function DashboardHomepage({
  latestExploitations,
  latestLogEntries,
}: DashboardHomepageProps) {
  const hasLogEntries = latestLogEntries?.length > 0
  const hasExploitations = latestExploitations?.length > 0
  const createExploitationUrl = urlFor('exploitations.create')

  return (
    <>
      <Hero createExploitationUrl={createExploitationUrl} />

      <HomeSection title="Dernières notes de terrain ajoutées">
        {hasLogEntries ? (
          <Timeline
            items={latestLogEntries.map((log) => ({
              content: (
                <ListItem
                  variant="compact"
                  key={log.id}
                  title={getLogEntryTitle(log)}
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
                      content: log.exploitation?.name || 'Exploitation inconnue',
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
            hint="Pour créer votre première tâche, rendez-vous sur l'exploitation concernée"
            illustrationSrc="/placeholder-illustrations/journal-colored.png"
          />
        )}
      </HomeSection>

      <HomeSection title="Dernières exploitations agricoles créées" background="secondary">
        {hasExploitations ? (
          <>
            <ExploitationsList exploitations={latestExploitations} />
            <div className="flex justify-center fr-mt-4w">
              <Button
                iconId="fr-icon-arrow-right-line"
                linkProps={{ href: '/exploitations' }}
                className="w-fit whitespace-nowrap"
              >
                Consulter les exploitations agricoles
              </Button>
            </div>
          </>
        ) : (
          <EmptyPlaceholder
            size="lg"
            priority="secondary"
            label="Aucune exploitation agricole enregistrée"
            illustrationSrc="/placeholder-illustrations/exploitations.png"
            buttonLabel="Ajouter une première exploitation agricole"
            actionAriaLabel="Ajouter une première exploitation agricole"
            buttonIcon="fr-icon-arrow-right-line"
            handleClick={() => {
              router.visit(createExploitationUrl)
            }}
          />
        )}
      </HomeSection>
    </>
  )
}
