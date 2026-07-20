import Layout from '~/ui/layouts/layout'
import { Head, router, useForm } from '@inertiajs/react'
import { useState } from 'react'
import { Breadcrumb } from '@codegouvfr/react-dsfr/Breadcrumb'
import { Button } from '@codegouvfr/react-dsfr/Button'
import { fr } from '@codegouvfr/react-dsfr'
import { Upload } from '@codegouvfr/react-dsfr/Upload'
import { FlashMessages } from '~/components/flash-message'
import TruncatedText from '~/ui/TruncatedText'
import ProjectStepForm from '~/components/projets/form/project-step-form'
import { ProjectStepTagSelector } from '~/components/projets/form/ProjectStepTagSelector'
import type { ProjectStepFormData } from '~/pages/projets/etapes/creation'
import { getProjectStepTitle } from '~/functions/project_steps'
import SmallSection from '~/ui/SmallSection'
import { ProjectStepDocumentList } from '~/components/projets/ProjectStepDocumentList'
import { useRef } from 'react'
import { urlFor } from '~/client'

export default function ProjectStepEditionPage({ projet, step, flashMessages }: any) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [tagInputValue, setTagInputValue] = useState('')
  const { data, setData, patch, resetAndClearErrors } = useForm<ProjectStepFormData>({
    id: step.id,
    title: step.title || '',
    note: step.note || '',
    date: step.date?.slice(0, 10) || '',
    documents: [],
    tags: step.tags.map((tag) => tag.id) || [],
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    patch(urlFor('projets.steps.edit', { projectId: projet.id, stepId: step.id }), {
      onSuccess: () => {
        setTagInputValue('')
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
            currentPageLabel="Édition de l'étape"
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

                {step.documents && step.documents.length > 0 && (
                  <div className="fr-mt-3w flex flex-col gap-2">
                    <div className="fr-mt-2w fr-mb-1w text-sm font-bold">
                      Fichiers déjà téléchargés :
                    </div>
                    <ProjectStepDocumentList
                      documents={step.documents}
                      deleteDocumentUrl={urlFor('projets.steps.documents.destroy', {
                        projectId: projet.id,
                        stepId: step.id,
                      })}
                    />
                  </div>
                )}
              </SmallSection>
            </aside>

            <ProjectStepForm data={data} setData={setData} />
          </div>

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
