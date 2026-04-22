import SmallSection from '~/ui/SmallSection'
import { useState } from 'react'
import Select from '@codegouvfr/react-dsfr/SelectNext'
import Button from '@codegouvfr/react-dsfr/Button'
import Loader from '~/ui/Loader'

type ExportUrls = {
  infoGenerale: string
  captages: string
  assolement: string
  cultureEvolution: string
  qualiteEau: string
}

export function AacActionCard({ exportUrls }: { exportUrls: ExportUrls }) {
  const [exportUrl, setExportUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  return (
    <SmallSection title="Actions" priority="secondary" hasBorder>
      <div className="flex items-end gap-2 fr-mb-3w">
        <Select
          className="flex-1 fr-mb-0"
          options={[
            { value: 'infoGenerale', label: 'Informations générales' },
            { value: 'captages', label: 'Captages' },
            { value: 'assolement', label: 'Assolement' },
            { value: 'cultureEvolution', label: 'Évolution des cultures' },
            { value: 'qualiteEau', label: "Qualité de l'eau" },
          ]}
          label={'Export des données'}
          nativeSelectProps={{
            onChange: (e) => {
              const key = e.target.value as keyof ExportUrls
              setExportUrl(exportUrls[key] ?? null)
            },
          }}
        />
        <Button
          priority={'secondary'}
          title={'Export des données'}
          disabled={exportUrl === null || isLoading}
          onClick={() => {
            if (!exportUrl) return

            setIsLoading(true)
            fetch(exportUrl)
              .then(async (res) => {
                if (!res.ok) {
                  throw new Error(`Erreur lors de l'export : ${res.statusText}`)
                }
                const disposition = res.headers.get('Content-Disposition')
                const filename = disposition?.match(/filename="?([^"]+)"?/)?.[1] ?? 'export'
                const blob = await res.blob()
                return { blob, filename }
              })
              .then(({ blob, filename }) => {
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = filename
                a.click()
                URL.revokeObjectURL(url)
              })
              .finally(() => setIsLoading(false))
          }}
        >
          {isLoading ? (
            <Loader size={'sm'} type={'dots'} />
          ) : (
            <div className="fr-icon-download-line" aria-label={'Export des données'} />
          )}
        </Button>
      </div>
    </SmallSection>
  )
}
