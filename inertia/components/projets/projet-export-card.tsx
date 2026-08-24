import { useState } from 'react'
import SmallSection from '~/ui/SmallSection'
import Select from '@codegouvfr/react-dsfr/SelectNext'
import Button from '@codegouvfr/react-dsfr/Button'
import { urlFor } from '~/client'

export type ProjetExportCardProps = {
  projectId: string
  hasSteps: boolean
  hasExploitations: boolean
}

export default function ProjetExportCard({
  projectId,
  hasSteps,
  hasExploitations,
}: ProjetExportCardProps) {
  const [exportUrl, setExportUrl] = useState<string | null>(null)

  return (
    <SmallSection title="Export des données" priority="secondary" hasBorder>
      <div className="flex items-end gap-2">
        <Select
          className="flex-1 fr-mb-0"
          options={[
            { value: 'exploitations', label: 'Exploitations liées', disabled: !hasExploitations },
            { value: 'etapes', label: 'Étapes du projet', disabled: !hasSteps },
          ]}
          label={'Export des données'}
          nativeSelectProps={{
            onChange: (e) => {
              if (e.target.value === 'exploitations') {
                setExportUrl(urlFor('projets.exploitations.export', { projectId }))
              } else if (e.target.value === 'etapes') {
                setExportUrl(urlFor('projets.steps.export', { projectId }))
              }
            },
          }}
        />
        {exportUrl === null ? (
          <Button
            iconId="fr-icon-download-line"
            priority={'secondary'}
            title={'Export des données'}
            disabled={true}
          />
        ) : (
          <a
            className="fr-btn fr-btn--secondary fr-icon-download-line"
            href={exportUrl}
            title={'Export des données'}
            aria-label={'Export des données'}
          />
        )}
      </div>
    </SmallSection>
  )
}
