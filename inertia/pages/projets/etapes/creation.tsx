import Layout from '~/ui/layouts/layout'
import { FormEvent, useRef } from 'react'
import { Head, router, useForm } from '@inertiajs/react'
import { Breadcrumb } from '@codegouvfr/react-dsfr/Breadcrumb'
import { Button } from '@codegouvfr/react-dsfr/Button'
import { fr } from '@codegouvfr/react-dsfr'
import { Alert } from '@codegouvfr/react-dsfr/Alert'
import { Upload } from '@codegouvfr/react-dsfr/Upload'
import TruncatedText from '~/ui/TruncatedText'
import { InferPageProps } from '@adonisjs/inertia/types'
import ProjectStepForm from '~/components/projets/form/project-step-form'
import ProjectStepsController from '#controllers/project_steps_controller'
import SmallSection from '~/ui/SmallSection'

export type ProjectStepFormData = {
  id?: string
  title: string
  note: string
  date: string
  documents?: File[]
}

export default function ProjectStepCreationPage({
  projet,
  createStepUrl,
}: InferPageProps<ProjectStepsController, 'createStepForm'>) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { data, setData, post, resetAndClearErrors } = useForm<ProjectStepFormData>({
    title: '',
    note: '',
    date: '',
    documents: [],
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
            currentPageLabel="Nouvelle étape"
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
          description="Veuillez remplir au moins un de ces champs pour créer l'étape."
        />

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="grid grid-cols-[320px_1fr] gap-4">
            <aside className="flex flex-col gap-4">
              <SmallSection
                title="Documents"
                iconId="fr-icon-attachment-line"
                hasBorder
                priority="secondary"
              >
                <div className="flex flex-col gap-2">
                  <Upload
                    label=""
                    hint="Format PDF, maximum 10 Mo"
                    multiple={true}
                    className="flex-1 border-2 font-bold border-dashed border-[var(--border-default-grey)] fr-p-1w text-sm"
                    nativeInputProps={{
                      accept: 'application/pdf',
                      ref: fileInputRef,
                      onChange: (e) => {
                        if (e.target.files) {
                          const files: File[] = []
                          for (let i = 0; i < e.target.files.length; i++) {
                            files.push(e.target.files[i])
                          }
                          setData('documents', files)
                        }
                      },
                    }}
                  />
                  <Button
                    size="small"
                    type="button"
                    priority="tertiary"
                    disabled={!data.documents || data.documents.length === 0}
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => {
                      setData('documents', [])
                      if (fileInputRef.current) {
                        fileInputRef.current.files = new DataTransfer().files
                      }
                    }}
                  >
                    Réinitialiser la sélection
                  </Button>
                </div>
              </SmallSection>
            </aside>

            <ProjectStepForm data={data} setData={setData} />
          </div>

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
