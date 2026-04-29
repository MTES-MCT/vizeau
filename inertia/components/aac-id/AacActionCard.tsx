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

function getFilenameFromDisposition(disposition: string | null) {
  if (!disposition) return 'export.csv'

  const utf8Filename = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1]
  if (utf8Filename) {
    return decodeURIComponent(utf8Filename)
  }

  return disposition.match(/filename="?([^";]+)"?/i)?.[1] ?? 'export.csv'
}

async function downloadCsv(url: string) {
  const response = await fetch(url, {
    credentials: 'same-origin',
  })

  if (!response.ok) {
    throw new Error(`Erreur lors de l'export : ${response.status} ${response.statusText}`)
  }

  const blob = await response.blob()
  const filename = getFilenameFromDisposition(response.headers.get('Content-Disposition'))
  const objectUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = objectUrl
  link.download = filename
  link.style.display = 'none'

  document.body.append(link)
  link.click()
  link.remove()

  window.setTimeout(() => {
    window.URL.revokeObjectURL(objectUrl)
  }, 1000)
}

export function AacActionCard({ exportUrls }: { exportUrls: ExportUrls }) {
  const [exportUrl, setExportUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  return (
    <SmallSection title="Actions" priority="secondary" hasBorder>
      <div className="flex items-end gap-2 fr-mb-3w">
        <Select
          className="flex-1 fr-mb-0"
          disabled={isLoading}
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
          aria-busy={isLoading}
          disabled={exportUrl === null || isLoading}
          onClick={() => {
            if (!exportUrl) return

            setIsLoading(true)

            downloadCsv(exportUrl)
              .catch((error) => {
                console.error(error)
              })
              .finally(() => {
                setIsLoading(false)
              })
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
