import Layout from '~/ui/layouts/layout'
import { Head, router, useForm } from '@inertiajs/react'
import { Breadcrumb } from '@codegouvfr/react-dsfr/Breadcrumb'
import { Button } from '@codegouvfr/react-dsfr/Button'
import { fr } from '@codegouvfr/react-dsfr'
import { FlashMessages } from '~/components/flash-message'
import TruncatedText from '~/ui/TruncatedText'
import ProjectsController from '#controllers/projects_controller'
import { InferPageProps } from '@adonisjs/inertia/types'
import ProjectStepForm from '~/components/projets/form/project-step-form'
import type { ProjectStepFormData } from '~/pages/projets/etapes/creation'
import { getProjectStepTitle } from '~/functions/project_steps'

export default function ProjectStepEditionPage({
  projet,
  step,
  editStepUrl,
  flashMessages,
}: InferPageProps<ProjectsController, 'getStepForEdition'>) {
  const { data, setData, patch, resetAndClearErrors } = useForm<ProjectStepFormData>({
    id: step.id,
    title: step.title || '',
    note: step.note || '',
    date: step.date?.slice(0, 10) || '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    patch(editStepUrl, {
      onSuccess: () => {
        resetAndClearErrors()
      },
    })
  }

  return (
    <Layout>
      <Head title="Édition d'une étape" />
      <div style={{ backgroundColor: fr.colors.decisions.background.alt.blueFrance.default }}>
        <div className="fr-container">
          <Breadcrumb
            className="fr-my-1w fr-py-1w"
            currentPageLabel="Édition de la tâche"
            homeLinkProps={{ href: '/' }}
            segments={[
              {
                label: <TruncatedText maxStringLength={50}>{projet.name}</TruncatedText>,
                linkProps: { href: `/projets/${projet.id}` },
              },
              {
                label: (
                  <TruncatedText maxStringLength={50}>{getProjectStepTitle(step)}</TruncatedText>
                ),
                linkProps: { href: `/projets/${projet.id}/etapes/${step.id}` },
              },
            ]}
          />
        </div>
      </div>

      <div className="fr-container fr-my-4w flex flex-col gap-6">
        <FlashMessages flashMessages={flashMessages} />

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <ProjectStepForm data={data} setData={setData} />

          <div className="flex w-full items-center justify-end gap-3">
            <Button
              type="button"
              priority="secondary"
              onClick={() => router.visit(`/projets/${projet.id}/etapes/${step.id}`)}
            >
              Retour
            </Button>

            <Button
              type="submit"
              disabled={data.title.trim() === '' && data.note.trim() === '' && data.date === ''}
            >
              Valider
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
