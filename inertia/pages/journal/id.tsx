import { useMemo } from 'react'
import { InferPageProps } from '@adonisjs/inertia/types'
import LogEntriesController from '#controllers/log_entries_controller'
import Layout from '~/ui/layouts/layout'
import { Head } from '@inertiajs/react'
import { Breadcrumb } from '@codegouvfr/react-dsfr/Breadcrumb'
import { fr } from '@codegouvfr/react-dsfr'
import { Button } from '@codegouvfr/react-dsfr/Button'
import LogEntryInformationCard from '~/components/log-entry-id/LogEntryInformationCard'
import LogEntryTagsCard from '~/components/log-entry-id/LogEntryTagsCard'
import LogEntryNoteCard from '~/components/log-entry-id/LogEntryNoteCard'
import { truncateStr } from '~/functions/string'

export default function SingleTask({
  logEntry,
  isCreator,
  exploitation,
  user,
}: InferPageProps<LogEntriesController, 'get'> & { exploitationId: number }) {

  const logEntryTitle = useMemo(() => {
     if (logEntry.title) {
      return logEntry.title
    }
    if (logEntry.notes) {
      return truncateStr(logEntry.notes, 40)
    }
      return new Date(logEntry.createdAt).toLocaleDateString()

  }, [logEntry]);

  return (
    <Layout>
      <Head title="Détail de l'entrée de journal" />
      <div
        className="fr-p-2w"
        style={{ backgroundColor: fr.colors.decisions.background.alt.blueFrance.default }}
      >
        <div className="fr-container flex justify-between items-center">
          <Breadcrumb
            currentPageLabel={logEntryTitle}
            homeLinkProps={{
              href: '/accueil',
            }}
            segments={[
              {
                label: 'Exploitations',
                linkProps: {
                  href: '/exploitations',
                },
              },
              {
                label: exploitation.name,
                linkProps: {
                  href: `/exploitations/${exploitation.id}`,
                },
              },
            ]}
            className={'fr-my-0'}
          />
          {isCreator && (
            <div className="flex items-center">
              <Button
                iconId="fr-icon-edit-line"
                priority={'secondary'}
                linkProps={{
                  href: `/exploitations/${exploitation.id}/journal/${logEntry.id}/edition`,
                }}
              >
                Éditer
              </Button>
            </div>
          )}
        </div>
      </div>
      <div className="fr-container fr-mt-4w fr-mb-4w">
        <section className="grid grid-cols-[350px_1fr] gap-4">
          <aside className="flex flex-col gap-4">
            <LogEntryInformationCard userName={user?.fullName} createdAt={logEntry.createdAt} />
            <LogEntryTagsCard tags={logEntry.tags} />
          </aside>
          <div>
            <h4 className="fr-h4 fr-mb-2w">{logEntryTitle}</h4>
            <LogEntryNoteCard notes={logEntry.notes} />
          </div>
        </section>
      </div>
    </Layout>
  )
}
