import { Alert } from '@codegouvfr/react-dsfr/Alert'
import { Pagination } from '@codegouvfr/react-dsfr/Pagination'
import { router, usePage } from '@inertiajs/react'
import React from 'react'

import SelectedTerritoires, { getTerritoireTitle } from '~/components/selected-territoires'
import CheckboxCard from '~/ui/CheckboxCard'
import type { ProjetFormData, ProjetFormPageProps } from './projet-form'
import type { PaginatedJson } from '#types/models'
import type { Data } from '@generated/data'

type TerritoiresStepProps = {
  data: ProjetFormData
  setData: React.Dispatch<React.SetStateAction<ProjetFormData>>
}

export default function TerritoiresStep({ data, setData }: TerritoiresStepProps) {
  const { territoires, aacs } = usePage<
    ProjetFormPageProps & { territoires: PaginatedJson<Data.Territoire> }
  >().props
  const selectedIds = data.territoireIds ?? []

  function handleChange(id: string, checked: boolean) {
    setData((prev) => {
      const current = prev.territoireIds ?? []
      const next = checked ? [...current, id] : current.filter((t) => t !== id)
      return { ...prev, territoireIds: next }
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <Alert
        severity="info"
        small
        description="Sélectionnez au moins un territoire (AAC) pour associer ce projet. Seuls les territoires auxquels vous avez accès sont listés."
      />
      {/* Utile seulement si la sélection peut se trouver sur une autre page */}
      {territoires.metadata.lastPage > 1 && (
        <SelectedTerritoires
          territoires={aacs}
          selectedIds={selectedIds}
          onRemove={(id) => handleChange(id, false)}
        />
      )}
      <div className="flex flex-col gap-3">
        {territoires.data.map((territoire) => (
          <CheckboxCard
            key={territoire.id}
            value={territoire.id}
            title={getTerritoireTitle(territoire)}
            subtitle={territoire.code ? `Code SANDRE : ${territoire.code}` : 'Pas de code SANDRE'}
            isSelected={selectedIds.includes(territoire.id)}
            onCheck={() => handleChange(territoire.id, !selectedIds.includes(territoire.id))}
          />
        ))}

        {territoires.metadata.lastPage > 1 && (
          <Pagination
            count={territoires.metadata.lastPage}
            defaultPage={territoires.metadata.currentPage}
            showFirstLast={true}
            getPageLinkProps={(pageNumber) => ({
              href: '#',
              onClick: (e: React.MouseEvent) => {
                e.preventDefault()
                router.reload({
                  only: ['territoires'],
                  data: { territoiresPage: String(pageNumber) },
                  preserveState: true,
                  replace: true,
                })
              },
            })}
          />
        )}
      </div>
    </div>
  )
}
