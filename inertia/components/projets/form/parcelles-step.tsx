import { useMemo, useState } from 'react'
import { usePage } from '@inertiajs/react'

import ParcellesStepOverview, {
  useAacEmprises,
} from '~/components/parcelle/parcelles-step-overview'
import ParcellesWorkspace, {
  ParcellesSelection,
  WorkspaceExploitations,
} from '~/components/parcelle/parcelles-workspace'
import type { ProjetFormData, ProjetFormPageProps, SelectedParcelleFormData } from './projet-form'
import { getProjectExploitations } from '~/functions/projet_parcelles'

type ParcellesStepProps = {
  data: ProjetFormData
  setData: React.Dispatch<React.SetStateAction<ProjetFormData>>
}

function toSelection(items: SelectedParcelleFormData[]): ParcellesSelection {
  const selection: ParcellesSelection = {}
  for (const { rpgId, surface, cultureCode, centroid, year } of items) {
    const millesime = String(year)
    selection[millesime] = [
      ...(selection[millesime] ?? []),
      { rpgId, surface, cultureCode, centroid },
    ]
  }
  return selection
}

// Les nouvelles parcelles sont rattachées à l'exploitation qui les déclare ce millésime
function fromSelection(
  selection: ParcellesSelection,
  previousItems: SelectedParcelleFormData[],
  exploitations: ProjetFormPageProps['exploitations']
): SelectedParcelleFormData[] {
  return Object.entries(selection).flatMap(([millesime, parcelles]) =>
    parcelles.map((parcelle) => {
      const existing = previousItems.find(
        (item) => String(item.year) === millesime && item.rpgId === parcelle.rpgId
      )
      if (existing) return existing

      const isSameParcelle = (p: { year: number; rpgId: string | null }) =>
        String(p.year) === millesime && p.rpgId === parcelle.rpgId
      const linkedExploitation = exploitations.find((exp) => exp.parcelles?.some(isSameParcelle))
      return {
        id: linkedExploitation?.parcelles?.find(isSameParcelle)?.id,
        year: Number(millesime),
        ...parcelle,
      }
    })
  )
}

export default function ParcellesStep({ data, setData }: ParcellesStepProps) {
  const { pmtilesUrl, exploitations, aacs, projet } = usePage<ProjetFormPageProps>().props
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false)
  const [millesime, setMillesime] = useState(data.parcelles.millesime)
  const allAacEmprises = useAacEmprises(aacs)
  // Seules les AAC cochées à l'étape précédente sont proposées sur la carte, toutes à défaut
  const aacEmprises = useMemo(() => {
    const checkedAacs = allAacEmprises.filter((aac) => data.territoireIds.includes(aac.id))
    return checkedAacs.length > 0 ? checkedAacs : allAacEmprises
  }, [allAacEmprises, data.territoireIds])

  const { items } = data.parcelles
  const initialSelection = useMemo(() => toSelection(items), [items])
  // Parcelles enregistrées du projet, aucune en création : seules celles-ci peuvent être « retirées »
  const savedSelection = useMemo(
    () =>
      toSelection(
        (projet?.parcelles ?? []).flatMap((p) =>
          p.rpgId === null
            ? []
            : [
                {
                  year: p.year,
                  rpgId: p.rpgId,
                  surface: p.surface === null ? null : Number(p.surface),
                  cultureCode: p.cultureCode,
                  centroid: p.centroid ?? undefined,
                },
              ]
        )
      ),
    [projet]
  )
  const millesimeParcelles = useMemo(
    () => initialSelection[millesime] ?? [],
    [initialSelection, millesime]
  )
  const projectName = data.generalInfos.projectName
  const workspaceExploitations = useMemo<WorkspaceExploitations>(
    () => ({
      list: getProjectExploitations(exploitations, data.exploitations),
      initialAddedIds: data.parcelles.addedExploitationIds,
    }),
    [exploitations, data.exploitations, data.parcelles.addedExploitationIds]
  )

  const handleSubmit = (
    selection: ParcellesSelection,
    _changedMillesimes: string[],
    addedExploitationIds: Record<string, string[]>
  ) => {
    setData((prev) => ({
      ...prev,
      parcelles: {
        ...prev.parcelles,
        items: fromSelection(selection, prev.parcelles.items, exploitations),
        addedExploitationIds,
      },
    }))
  }

  return (
    <>
      <ParcellesStepOverview
        pmtilesUrl={pmtilesUrl}
        millesime={millesime}
        onMillesimeChange={setMillesime}
        parcelles={millesimeParcelles}
        aacs={aacEmprises}
        territoireIds={data.territoireIds}
        title="Parcelles du projet"
        onManage={() => setIsWorkspaceOpen(true)}
      />

      <ParcellesWorkspace
        variant="overlay"
        isOpen={isWorkspaceOpen}
        title={projectName ? `Gérer les parcelles · ${projectName}` : 'Gérer les parcelles'}
        selectionTitle="Parcelles associées au projet"
        initialSelection={initialSelection}
        savedSelection={savedSelection}
        defaultMillesime={millesime}
        aacs={aacEmprises}
        mapFocus={{ territoireIds: data.territoireIds }}
        pmtilesUrl={pmtilesUrl}
        exploitations={workspaceExploitations}
        submitLabel="Valider les parcelles"
        onSubmit={handleSubmit}
        onClose={() => setIsWorkspaceOpen(false)}
      />
    </>
  )
}
