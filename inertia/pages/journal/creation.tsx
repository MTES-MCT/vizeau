import Layout from '~/ui/layouts/layout'
import { useState, FormEvent } from 'react'
import { Head, useForm, router } from '@inertiajs/react'
import { EntryLogForm } from '~/components/exploitation-id/EntryLogForm'
import { Breadcrumb } from '@codegouvfr/react-dsfr/Breadcrumb'
import { Button } from '@codegouvfr/react-dsfr/Button'
import { fr } from '@codegouvfr/react-dsfr'
import LogEntriesController from '#controllers/log_entries_controller'
import { InferPageProps } from '@adonisjs/inertia/types'
import { Alert } from '@codegouvfr/react-dsfr/Alert'
import { FlashMessages } from '~/components/flash-message'

export default function TaskCreationPage({
  exploitation,
  createEntryLogUrl,
  flashMessages,
}: InferPageProps<LogEntriesController, 'index'>) {
  const [inputValue, setInputValue] = useState('')
  const { data, setData, post, resetAndClearErrors } = useForm<{
    notes: string
    tags: number[]
  }>({
    notes: '',
    tags: [],
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    post(createEntryLogUrl, {
      onSuccess: () => {
        setInputValue('')
        resetAndClearErrors()
      },
    })
  }

  return (
    <Layout>
      <Head title="Créer une tâche" />
      <div
        style={{
          backgroundColor: fr.colors.decisions.background.alt.blueFrance.default,
        }}
      >
        <div className="fr-container">
          <Breadcrumb
            className="fr-my-1w fr-py-1w"
            currentPageLabel="Nouvelle tâche"
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
        <Alert
          small
          severity="info"
          description="La création d'une tâche est possible lorsqu'au moins une note ou un tag est ajouté."
        />

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <FlashMessages flashMessages={flashMessages} />
          <EntryLogForm
            data={data}
            setData={setData}
            inputValue={inputValue}
            setInputValue={setInputValue}
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

            <Button type="submit" disabled={data.tags.length === 0 && data.notes === ''}>
              Valider
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
