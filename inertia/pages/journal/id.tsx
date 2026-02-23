import { InferPageProps } from '@adonisjs/inertia/types'
import LogEntriesController from '#controllers/log_entries_controller'
import { createModal } from '@codegouvfr/react-dsfr/Modal'
import Layout from '~/ui/layouts/layout'
import { Head } from '@inertiajs/react'
import { Breadcrumb } from '@codegouvfr/react-dsfr/Breadcrumb'
import { fr } from '@codegouvfr/react-dsfr'
import { Button } from '@codegouvfr/react-dsfr/Button'
import LogEntryInformationCard from '~/components/log-entry-id/LogEntryInformationCard'
import LogEntryTagsCard from '~/components/log-entry-id/LogEntryTagsCard'
import LogEntryNoteCard from '~/components/log-entry-id/LogEntryNoteCard'
import DeleteAlert from '~/ui/DeleteAlert'
import { router } from '@inertiajs/react'
import { Alert } from '@codegouvfr/react-dsfr/Alert'
import { getLogEntryTitle } from '~/functions/log_entries'
import TruncatedText from '~/ui/TruncatedText'
import SectionCard from '~/ui/SectionCard'
import FileItemsList from '~/ui/FileItemList'

export default function SingleTask({
  logEntry,
  isCreator,
  exploitation,
  user,
  deleteEntryLogUrl,
  completeEntryLogUrl,
}: InferPageProps<LogEntriesController, 'get'>) {
  const deleteEntryLogModal = createModal({
    id: 'delete-entry-log-modal',
    isOpenedByDefault: false,
  })

  const logEntryTitle = getLogEntryTitle(logEntry)

  return (
    <Layout>
      <Head title="Détail de l'entrée de journal" />
      <div
        className="fr-p-2w"
        style={{ backgroundColor: fr.colors.decisions.background.alt.blueFrance.default }}
      >
        <div className="fr-container flex justify-between items-center gap-4">
          <div className="min-w-0 flex-1">
            <Breadcrumb
              className="w-full fr-my-0"
              currentPageLabel={
                <TruncatedText maxStringLength={50} hideTooltip>
                  {logEntryTitle}
                </TruncatedText>
              }
              homeLinkProps={{
                href: '/accueil',
              }}
              segments={[
                {
                  label: 'Exploitations agricoles',
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
            />
          </div>
          {isCreator && (
            <div className="flex items-center flex-shrink-0">
              <Button
                iconId="fr-icon-edit-line"
                priority={'secondary'}
                linkProps={{
                  href: `/exploitations/${exploitation.id}/journal/${logEntry.id}/edition`,
                }}
              >
                Éditer la tâche
              </Button>
            </div>
          )}
        </div>
      </div>
      <div className="fr-container fr-mt-4w fr-mb-4w">
        <section className="grid grid-cols-[350px_1fr] gap-4">
          <aside className="flex flex-col gap-4">
            <LogEntryInformationCard
              userName={user?.fullName}
              logEntry={logEntry}
              completeEntryLogUrl={completeEntryLogUrl}
            />
            <LogEntryTagsCard tags={logEntry.tags} />
            <DeleteAlert
              title="Supprimer la tâche"
              description="Attention : cette action est irréversible !"
              size="sm"
              onDelete={deleteEntryLogModal.open}
            />
            <deleteEntryLogModal.Component
              title=""
              size="large"
              buttons={[
                { children: 'Annuler', doClosesModal: true },
                {
                  children: "Supprimer l'entrée de journal de bord",
                  onClick: () => {
                    router.delete(deleteEntryLogUrl, {
                      data: { id: logEntry.id },
                    })
                  },
                },
              ]}
            >
              <Alert
                severity="error"
                title="Suppression d'une entrée de journal de bord"
                description="Vous êtes sur le point de supprimer cette entrée de journal de bord, voulez-vous continuer ?"
              />
            </deleteEntryLogModal.Component>
          </aside>
          <SectionCard title={logEntryTitle} hideLongTitleTooltip>
            <div className="flex flex-col gap-10">
              <LogEntryNoteCard notes={logEntry.notes} />
              <SectionCard
                size="small"
                background="secondary"
                icon="fr-icon-attachment-line"
                title="Documents"
              >
                {logEntry.documents && logEntry.documents.length > 0 && (
                  <div className="bg-white">
                    <FileItemsList
                      files={logEntry.documents.map((document) => ({
                        name: document.name,
                        href: document.href,
                        size: document.sizeInBytes,
                        format: 'PDF',
                      }))}
                    />
                  </div>
                )}
              </SectionCard>
            </div>
          </SectionCard>
        </section>
      </div>
    </Layout>
  )
}
