import { useState } from 'react'
import { InferPageProps } from '@adonisjs/inertia/types'
import LogEntriesController from '#controllers/log_entries_controller'
import { Head, useForm, router } from '@inertiajs/react'
import { LogEntryForm } from '~/components/exploitation-id/LogEntryForm'
import Layout from '~/ui/layouts/layout'
import { Breadcrumb } from '@codegouvfr/react-dsfr/Breadcrumb'
import { fr } from '@codegouvfr/react-dsfr'
import { Button } from '@codegouvfr/react-dsfr/Button'
import { FlashMessages } from '~/components/flash-message'
import { LogEntryFormData } from '~/pages/journal/creation'

export default function TaskEditionPage({
  logEntry,
  editEntryLogUrl,
  exploitation,
  flashMessages,
  isCreator,
}: InferPageProps<LogEntriesController, 'getForEdition'>) {
  const [inputValue, setInputValue] = useState('')
  const { data, setData, patch, resetAndClearErrors } = useForm<LogEntryFormData>({
    id: logEntry.id,
    title: logEntry.title || '',
    notes: logEntry.notes || '',
    tags: logEntry.tags?.map((tag: { id: number }) => tag.id) || [],
    date: logEntry.date || '',
    // Documents are handled separately, so we don't set them in the form data
    documents: [],
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    patch(editEntryLogUrl, {
      onSuccess: () => {
        setInputValue('')
        resetAndClearErrors()
      },
    })
  }

  return (
    <Layout>
      <Head title="Édition de l'entrée de journal" />
      <div
        style={{
          backgroundColor: fr.colors.decisions.background.alt.blueFrance.default,
        }}
      >
        <div className="fr-container">
          <Breadcrumb
            className="fr-my-1w fr-py-1w"
            currentPageLabel="Édition de la tâche"
            homeLinkProps={{ href: '/' }}
            segments={[
              {
                label: exploitation.name,
                linkProps: { href: `/exploitations/${exploitation.id}` },
              },
            ]}
          />
        </div>
      </div>
      <div className="fr-container fr-my-4w flex flex-col gap-10">
        <FlashMessages flashMessages={flashMessages} />

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <LogEntryForm
            data={data}
            setData={setData}
            inputValue={inputValue}
            setInputValue={setInputValue}
            existingDocuments={logEntry.documents || []}
            disabled={!isCreator}
          />
          <div className="flex w-full items-center justify-end gap-3">
            <Button
              type="button"
              priority="secondary"
              onClick={() => {
                setInputValue('')
                router.visit(`/exploitations/${exploitation.id}`)
              }}
            >
              Retour
            </Button>

            {isCreator && (
              <Button
                type="submit"
                disabled={data.tags.length === 0 && data.notes === '' && data.title === ''}
              >
                Valider
              </Button>
            )}
          </div>
        </form>
      </div>
    </Layout>
  )
}
