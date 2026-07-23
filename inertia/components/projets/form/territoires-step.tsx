import { Alert } from '@codegouvfr/react-dsfr/Alert'
import { Pagination } from '@codegouvfr/react-dsfr/Pagination'
import { router, usePage } from '@inertiajs/react'
import React from 'react'

import CheckboxCard from '~/ui/CheckboxCard'
import type { ProjetFormData } from './projet-form'

type TerritoiresStepProps = {
  data: ProjetFormData
  setData: React.Dispatch<React.SetStateAction<ProjetFormData>>
}

export default function TerritoiresStep({ data, setData }: TerritoiresStepProps) {
  const { territoires } = usePage().props
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
      <div className="flex flex-col gap-3">
        {territoires.data.map((territoire) => {
          let title = territoire.nom

          if (!title && territoire.code) {
            title = `AAC ${territoire.code}`
          } else if (!title) {
            title = `Territoire non-SANDRE sans nom (${territoire.id})`
          }

          return (
            <CheckboxCard
              key={territoire.id}
              value={territoire.id}
              title={title}
              subtitle={territoire.code ? `Code SANDRE : ${territoire.code}` : 'Pas de code SANDRE'}
              isSelected={selectedIds.includes(territoire.id)}
              onCheck={() => handleChange(territoire.id, !selectedIds.includes(territoire.id))}
            />
          )
        })}

        {territoires.meta.lastPage > 1 && (
          <Pagination
            count={territoires.meta.lastPage}
            defaultPage={territoires.meta.currentPage}
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
