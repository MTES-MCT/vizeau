import Layout from '~/ui/layouts/layout'
import { FormEvent } from 'react'
import { Head, router, useForm } from '@inertiajs/react'
import { Breadcrumb } from '@codegouvfr/react-dsfr/Breadcrumb'
import { Button } from '@codegouvfr/react-dsfr/Button'
import { fr } from '@codegouvfr/react-dsfr'
import { Alert } from '@codegouvfr/react-dsfr/Alert'
import { FlashMessages } from '~/components/flash-message'
import TruncatedText from '~/ui/TruncatedText'
import ProjectsController from '#controllers/projects_controller'
import { InferPageProps } from '@adonisjs/inertia/types'
import ProjectStepForm from '~/components/projets/form/project-step-form'

export type ProjectStepFormData = {
  id?: string
  title: string
  note: string
  date: string
}

export default function ProjectStepCreationPage({
  projet,
  createStepUrl,
  flashMessages,
}: InferPageProps<ProjectsController, 'createStepForm'>) {
  const { data, setData, post, resetAndClearErrors } = useForm<ProjectStepFormData>({
    title: '',
    note: '',
    date: '',
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    post(createStepUrl, {
      onSuccess: () => {
        resetAndClearErrors()
      },
    })
  }

  return (
    <Layout>
      <Head title="Créer une étape" />
      <div style={{ backgroundColor: fr.colors.decisions.background.alt.blueFrance.default }}>
        <div className="fr-container">
          <Breadcrumb
            className="fr-my-1w fr-py-1w"
            currentPageLabel="Nouvelle tâche"
            homeLinkProps={{ href: '/' }}
            segments={[
              {
                label: <TruncatedText maxStringLength={50}>{projet.name}</TruncatedText>,
                linkProps: { href: `/projets/${projet.id}` },
              },
            ]}
          />
        </div>
      </div>

      <div className="fr-container fr-my-4w flex flex-col gap-8">
        <Alert
          small
          severity="info"
          description="Veuillez remplir au moins un de ces champs pour créer la tâche."
        />

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <FlashMessages flashMessages={flashMessages} />

          <ProjectStepForm data={data} setData={setData} />

          <div className="flex w-full items-center justify-end gap-3">
            <Button
              type="button"
              priority="secondary"
              onClick={() => router.visit(`/projets/${projet.id}`)}
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
