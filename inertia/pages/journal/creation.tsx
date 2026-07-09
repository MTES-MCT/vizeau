import Layout from '~/ui/layouts/layout'
import { useState, FormEvent } from 'react'
import { Head, useForm, router } from '@inertiajs/react'
import { LogEntryForm } from '~/components/exploitation-id/LogEntryForm'
import { Breadcrumb } from '@codegouvfr/react-dsfr/Breadcrumb'
import { Button } from '@codegouvfr/react-dsfr/Button'
import { fr } from '@codegouvfr/react-dsfr'
import { Alert } from '@codegouvfr/react-dsfr/Alert'
import TruncatedText from '~/ui/TruncatedText'

export type LogEntryFormData = {
  id?: string
  title: string
  notes: string
  tags: number[]
  date: string
  documents: Array<{
    name: string
    size: number
  }>
}

export default function TaskCreationPage({ exploitation, createEntryLogUrl }: any) {
  const [inputValue, setInputValue] = useState('')
  const { data, setData, post, resetAndClearErrors } = useForm<LogEntryFormData>({
    title: '',
    notes: '',
    tags: [],
    date: '',
    documents: [],
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
                label: <TruncatedText maxStringLength={50}>{exploitation.name}</TruncatedText>,
                linkProps: { href: `/exploitations/${exploitation.id}` },
              },
            ]}
          />
        </div>
      </div>
      <div className="fr-container fr-my-4w flex flex-col">
        <Alert
          small
          severity="info"
          description="Veuillez remplir au moins un de ces champs pour créer la tâche."
        />

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <LogEntryForm
            data={data}
            setData={setData}
            inputValue={inputValue}
            setInputValue={setInputValue}
            existingDocuments={[]}
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

            <Button
              type="submit"
              disabled={data.tags.length === 0 && data.notes === '' && data.title === ''}
            >
              Valider
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
