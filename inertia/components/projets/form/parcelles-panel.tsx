import { useEffect, useRef, useState } from 'react'
import { Input } from '@codegouvfr/react-dsfr/Input'
import SectionCard from '~/ui/SectionCard'
import { pluralize } from '~/functions/string'
import {
  addExploitation,
  getAddedExploitations,
  getExploitationsWithParcelles,
  getSelectedExploitationParcelles,
  removeExploitation,
  type ProjetExploitation,
} from '~/functions/projet_parcelles'
import type { ProjetParcellesFormData } from './projet-form'
import ExploitationParcellesPicker, {
  EXPLOITATION_PICKER_LABEL,
} from './exploitation-parcelles-picker'
import AddedExploitationsTags from './added-exploitations-tags'
import ParcellesTabs, { type ParcelleCardData } from './parcelles-tabs'

const ANNOUNCEMENT_DURATION_MS = 4000

type ParcellesPanelProps = {
  parcelles: ProjetParcellesFormData
  projectExploitations: ProjetExploitation[]
  /** Exploitation du projet de chaque parcelle du millésime affiché, par identifiant RPG. */
  parcelleExploitations: Map<string, ProjetExploitation>
  onParcellesChange: (parcelles: ProjetParcellesFormData) => void
  /** Appelé au clic sur une parcelle de la liste qui a un centroïde, pour la montrer sur la carte. */
  onParcelleClick: (parcelle: ParcelleCardData) => void
}

/*
 * Panneau latéral de l'étape Parcelles. Il ne dépend pas de la carte, ce qui permet de le
 * tester dans Storybook.
 */
export default function ParcellesPanel({
  parcelles,
  projectExploitations,
  parcelleExploitations,
  onParcellesChange,
  onParcelleClick,
}: ParcellesPanelProps) {
  const { millesime } = parcelles
  // Les exploitations sans parcelle pour le millésime affiché ne sont pas proposées
  const exploitationsWithParcelles = getExploitationsWithParcelles(projectExploitations, millesime)
  const addedExploitations = getAddedExploitations(parcelles, projectExploitations)
  const pickerContainerRef = useRef<HTMLDivElement>(null)

  // Message de la zone aria-live, effacé après quelques secondes
  const [announcement, setAnnouncement] = useState('')
  useEffect(() => {
    if (!announcement) return
    const timeout = setTimeout(() => setAnnouncement(''), ANNOUNCEMENT_DURATION_MS)
    return () => clearTimeout(timeout)
  }, [announcement])

  const handleExploitationPick = (exploitation: ProjetExploitation) => {
    const result = addExploitation(parcelles, exploitation)
    onParcellesChange(result.parcelles)
    setAnnouncement(
      result.addedCount > 0
        ? `${pluralize(result.addedCount, 'parcelle ajoutée', 'parcelles ajoutées')} depuis ${exploitation.name}`
        : `${exploitation.name} ajoutée, ses parcelles étaient déjà sélectionnées`
    )
  }

  const handleExploitationRemove = (exploitation: ProjetExploitation) => {
    const removedCount = getSelectedExploitationParcelles(
      parcelles,
      exploitation,
      parcelleExploitations
    ).length
    onParcellesChange(removeExploitation(parcelles, exploitation))
    setAnnouncement(
      removedCount > 0
        ? `${exploitation.name} retirée, ${pluralize(removedCount, 'parcelle retirée', 'parcelles retirées')}`
        : `${exploitation.name} retirée`
    )
  }

  const handleRemovedParcellesReadd = (exploitation: ProjetExploitation) => {
    const result = addExploitation(parcelles, exploitation)
    onParcellesChange(result.parcelles)
    setAnnouncement(
      `${pluralize(result.addedCount, 'parcelle rajoutée', 'parcelles rajoutées')} depuis ${exploitation.name}`
    )
  }

  // Le champ d'ajout reprend le focus après un retrait, la pastille ayant disparu
  const focusPicker = () =>
    pickerContainerRef.current?.querySelector<HTMLInputElement>('[role="combobox"]')?.focus()

  return (
    <SectionCard title="Parcelles du projet" icon="fr-icon-map-pin-2-line" size="small" fillHeight>
      <div className="flex flex-col h-full">
        <div className="flex flex-col gap-2 fr-mb-2w shrink-0">
          {exploitationsWithParcelles.length > 0 ? (
            <div ref={pickerContainerRef}>
              <ExploitationParcellesPicker
                exploitations={exploitationsWithParcelles}
                addedExploitationIds={parcelles.addedExploitationIds[millesime] ?? []}
                onPick={handleExploitationPick}
              />
            </div>
          ) : (
            // Le projet a des exploitations, mais aucune n'a de parcelle sur ce millésime :
            // le champ reste visible, désactivé, pour expliquer leur absence
            projectExploitations.length > 0 && (
              <Input
                className="fr-mb-0"
                label={EXPLOITATION_PICKER_LABEL}
                hintText={`Aucune exploitation du projet n’a de parcelle en RPG ${millesime}.`}
                disabled
                nativeInputProps={{ placeholder: 'Nom de l’exploitation' }}
              />
            )
          )}
          <AddedExploitationsTags
            exploitations={addedExploitations}
            getSelectedCount={(e) =>
              getSelectedExploitationParcelles(parcelles, e, parcelleExploitations).length
            }
            onRemove={handleExploitationRemove}
            onRemoved={focusPicker}
          />
          <p className="fr-text--sm fr-mb-0" aria-live="polite">
            {announcement && (
              <>
                <span className="fr-icon-check-line fr-icon--sm fr-mr-1v" aria-hidden="true" />
                {announcement}
              </>
            )}
          </p>
        </div>
        <ParcellesTabs
          parcelles={parcelles}
          parcelleExploitations={parcelleExploitations}
          addedExploitations={addedExploitations}
          hasPicker={exploitationsWithParcelles.length > 0}
          onRemovedParcellesReadd={handleRemovedParcellesReadd}
          onParcelleClick={onParcelleClick}
        />
      </div>
    </SectionCard>
  )
}
