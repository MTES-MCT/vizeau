import { createModal } from '@codegouvfr/react-dsfr/Modal'
import Layout from '~/ui/layouts/layout'
import { Head, router } from '@inertiajs/react'
import { Breadcrumb } from '@codegouvfr/react-dsfr/Breadcrumb'
import { fr } from '@codegouvfr/react-dsfr'
import { Button } from '@codegouvfr/react-dsfr/Button'
import DeleteAlert from '~/ui/DeleteAlert'
import { Alert } from '@codegouvfr/react-dsfr/Alert'
import TruncatedText from '~/ui/TruncatedText'
import SectionCard from '~/ui/SectionCard'
import { getProjectStepTitle } from '~/functions/project_steps'
import type { ProjectStepJson } from '#types/models'
import StepInfoCard from '~/components/projets/step-info-card'
import { ProjectStepDocumentList } from '~/components/projets/ProjectStepDocumentList'
import ProjectStepTagsCard from '~/components/projets/ProjectStepTagsCard'
import EmptyPlaceholder from '~/ui/EmptyPlaceholder'

type SingleProjectStepProps = {
  projet: {
    id: string
    name: string
  }
  step: ProjectStepJson
  deleteStepUrl: string
  completeStepUrl: string
  deleteDocumentUrl: string
}

export default function SingleProjectStep({
  projet,
  step,
  deleteStepUrl,
  completeStepUrl,
  deleteDocumentUrl,
}: SingleProjectStepProps) {
  const deleteStepModal = createModal({
    id: 'delete-project-step-page-modal',
    isOpenedByDefault: false,
  })

  const stepTitle = getProjectStepTitle(step)

  return (
    <Layout>
      <Head title="Détail d'une étape" />
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
                  {stepTitle}
                </TruncatedText>
              }
              homeLinkProps={{ href: '/accueil' }}
              segments={[
                {
                  label: 'Projets',
                  linkProps: { href: '/projets' },
                },
                {
                  label: projet.name,
                  linkProps: { href: `/projets/${projet.id}` },
                },
              ]}
            />
          </div>
          <div className="flex items-center flex-shrink-0">
            <Button
              iconId="fr-icon-edit-line"
              priority="secondary"
              linkProps={{ href: `/projets/${projet.id}/etapes/${step.id}/edition` }}
            >
              Éditer la tâche
            </Button>
          </div>
        </div>
      </div>

      <div className="fr-container fr-mt-4w fr-mb-4w">
        <h2>{stepTitle}</h2>
        <section className="grid grid-cols-[350px_1fr] gap-4">
          <aside className="flex flex-col gap-4">
            <StepInfoCard step={step} completeStepUrl={completeStepUrl} />

            <ProjectStepTagsCard tags={step.tags} />

            <DeleteAlert
              title="Supprimer la tâche"
              description="Attention : cette action est irréversible !"
              size="sm"
              onDelete={deleteStepModal.open}
            />

            <deleteStepModal.Component
              title=""
              size="large"
              buttons={[
                { children: 'Annuler', doClosesModal: true },
                {
                  children: 'Supprimer la tâche',
                  onClick: () => {
                    router.delete(deleteStepUrl, {
                      data: { id: step.id },
                    })
                  },
                },
              ]}
            >
              <Alert
                severity="error"
                title="Suppression d'une étape"
                description="Vous êtes sur le point de supprimer cette étape, voulez-vous continuer ?"
              />
            </deleteStepModal.Component>
          </aside>

          <div className="flex flex-col gap-4">
            <SectionCard size="small" icon="fr-icon-booklet-line" title="Description">
              <p>{step.note || <i>Aucune note enregistrée.</i>}</p>
            </SectionCard>

            <SectionCard size="small" icon="fr-icon-attachment-line" title="Documents">
              {step.documents && step.documents.length > 0 ? (
                <ProjectStepDocumentList
                  documents={step.documents}
                  deleteDocumentUrl={deleteDocumentUrl}
                />
              ) : (
                <EmptyPlaceholder
                  illustrativeIcon="fr-icon-attachment-line"
                  label="Aucun document associé à cette étape."
                />
              )}
            </SectionCard>
          </div>
        </section>
      </div>
    </Layout>
  )
}
