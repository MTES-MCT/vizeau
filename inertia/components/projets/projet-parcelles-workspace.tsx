import { useMemo, useState } from 'react'
import { router, usePage } from '@inertiajs/react'
import { Button } from '@codegouvfr/react-dsfr/Button'

import { useAacEmprises } from '~/components/parcelle/parcelles-step-overview'
import ParcellesWorkspace, {
  ParcellesSelection,
  WorkspaceExploitations,
} from '~/components/parcelle/parcelles-workspace'
import { RPG_YEARS } from '~/functions/map'
import type { Data } from '@generated/data'

/*
 * Props de la page projets/id lues par le workspace. `aacs` et `exploitations` ne sont
 * chargées qu'à son ouverture.
 */
type ProjetParcellesPageProps = {
  pmtilesUrl: string
  aacs?: Data.Territoire.Variants['forEmprise'][]
  exploitations?: Data.Exploitation[]
}

type ProjetParcellesWorkspaceProps = {
  projet: Pick<Data.Project, 'id' | 'name' | 'territoires'> & { parcelles: Data.Parcelle[] }
}

function toSelection(parcelles: Data.Parcelle[]): ParcellesSelection {
  const selection: ParcellesSelection = {}
  for (const { year, rpgId, surface, cultureCode, centroid } of parcelles) {
    if (rpgId === null) continue
    const millesime = String(year)
    selection[millesime] = [
      ...(selection[millesime] ?? []),
      { rpgId, surface, cultureCode, centroid: centroid ?? undefined },
    ]
  }
  return selection
}

/*
 * Bouton « Gérer les parcelles » de la fiche projet : le workspace enregistre directement
 * les parcelles du projet, sans passer par le formulaire d'édition.
 */
export default function ProjetParcellesWorkspace({ projet }: ProjetParcellesWorkspaceProps) {
  const { pmtilesUrl, aacs = [], exploitations = [] } = usePage<ProjetParcellesPageProps>().props
  const aacEmprises = useAacEmprises(aacs)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const initialSelection = useMemo(() => toSelection(projet.parcelles), [projet.parcelles])
  const defaultMillesime = String(projet.parcelles[0]?.year ?? RPG_YEARS[0])
  const workspaceExploitations = useMemo<WorkspaceExploitations>(
    () => ({ list: exploitations, initialAddedIds: {} }),
    [exploitations]
  )

  const open = () => {
    router.reload({
      only: ['aacs', 'exploitations'],
      onStart: () => setIsLoading(true),
      onSuccess: () => setIsOpen(true),
      onFinish: () => setIsLoading(false),
    })
  }

  // Le back attend toutes les parcelles du projet, tous millésimes confondus
  const handleSubmit = (selection: ParcellesSelection) => {
    router.patch(
      `/projets/${projet.id}`,
      {
        parcelles: Object.entries(selection).flatMap(([year, parcelles]) =>
          parcelles.map((parcelle) => ({ year: Number(year), ...parcelle }))
        ),
      },
      {
        preserveState: true,
        preserveScroll: true,
        onStart: () => setIsSubmitting(true),
        onSuccess: () => setIsOpen(false),
        onFinish: () => setIsSubmitting(false),
      }
    )
  }

  return (
    <>
      <Button
        priority="secondary"
        iconId="fr-icon-edit-line"
        style={{ width: '100%', justifyContent: 'center' }}
        disabled={isLoading}
        onClick={open}
      >
        Gérer les parcelles
      </Button>

      <ParcellesWorkspace
        variant="overlay"
        isOpen={isOpen}
        closeOnSubmit={false}
        title={`Gérer les parcelles · ${projet.name}`}
        selectionTitle="Parcelles associées au projet"
        initialSelection={initialSelection}
        defaultMillesime={defaultMillesime}
        aacs={aacEmprises}
        mapFocus={{ territoireIds: projet.territoires?.map((territoire) => territoire.id) }}
        pmtilesUrl={pmtilesUrl}
        exploitations={workspaceExploitations}
        submitLabel="Enregistrer les parcelles"
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        onClose={() => setIsOpen(false)}
      />
    </>
  )
}
