import Layout from '~/ui/layouts/layout'
import { FormEvent, useRef, useState } from 'react'
import { Head, router, useForm } from '@inertiajs/react'
import { Breadcrumb } from '@codegouvfr/react-dsfr/Breadcrumb'
import { Button } from '@codegouvfr/react-dsfr/Button'
import { fr } from '@codegouvfr/react-dsfr'
import { Alert } from '@codegouvfr/react-dsfr/Alert'
import { Upload } from '@codegouvfr/react-dsfr/Upload'
import TruncatedText from '~/ui/TruncatedText'
import ProjectStepForm from '~/components/projets/form/project-step-form'
import { ProjectStepTagSelector } from '~/components/projets/form/ProjectStepTagSelector'
import SmallSection from '~/ui/SmallSection'
import { urlFor } from '~/client'
import type { ProjectJson } from '#types/models'

export type ProjectStepFormData = {
  id?: string
  title: string
  note: string
  date: string
  tags: number[]
  documents?: File[]
}

export default function ProjectStepCreationPage({ projet }: { projet: ProjectJson }) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [tagInputValue, setTagInputValue] = useState('')
  const { data, setData, post, resetAndClearErrors } = useForm<ProjectStepFormData>({
    title: '',
    note: '',
    date: '',
    tags: [],
    documents: [],
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    post(urlFor('projets.steps.create', { projectId: projet.id }), {
      onSuccess: () => {
        setTagInputValue('')
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
                title="Étiquettes"
                iconId="fr-icon-star-line"
                hasBorder
                priority="secondary"
              >
                <ProjectStepTagSelector
                  inputValue={tagInputValue}
                  setInputValue={setTagInputValue}
                  values={data.tags}
                  onChange={(tags) => setData('tags', tags)}
                />
              </SmallSection>

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
