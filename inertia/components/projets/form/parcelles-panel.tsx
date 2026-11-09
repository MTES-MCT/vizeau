import { useEffect, useState } from 'react'
import SectionCard from '~/ui/SectionCard'
import ListItem from '~/ui/ListItem'
import EmptyPlaceholder from '~/ui/EmptyPlaceholder'
import { getCultureByCode } from '~/functions/cultures_group'
import {
  addExploitation,
  getExploitationsWithParcelles,
  getParcelleExploitation,
  getSelectedParcelles,
  type ProjetExploitation,
} from '~/functions/projet_parcelles'
import type { ProjetParcellesFormData, SelectedParcelleFormData } from './projet-form'
import ExploitationParcellesPicker from './exploitation-parcelles-picker'

const ANNOUNCEMENT_DURATION_MS = 4000

function pluralize(count: number, singular: string, plural: string) {
  return `${count} ${count > 1 ? plural : singular}`
}

type ParcellesPanelProps = {
  parcelles: ProjetParcellesFormData
  projectExploitations: ProjetExploitation[]
  onParcellesChange: (parcelles: ProjetParcellesFormData) => void
  /** Appelé au clic sur une parcelle de la liste qui a un centroïde, pour la montrer sur la carte. */
  onParcelleClick: (parcelle: SelectedParcelleFormData) => void
}

/*
 * Panneau latéral de l'étape Parcelles. Il ne dépend pas de la carte, ce qui permet de le
 * tester dans Storybook.
 */
export default function ParcellesPanel({
  parcelles,
  projectExploitations,
  onParcellesChange,
  onParcelleClick,
}: ParcellesPanelProps) {
  const { millesime } = parcelles
  const selectedParcelles = getSelectedParcelles(parcelles)
  // Les exploitations sans parcelle pour le millésime affiché ne sont pas proposées
  const exploitationsWithParcelles = getExploitationsWithParcelles(projectExploitations, millesime)

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

  return (
    <SectionCard title="Parcelles sélectionnées" icon="fr-icon-map-pin-2-line" size="small">
      <div className="flex flex-col gap-2 fr-mb-2w">
        {exploitationsWithParcelles.length > 0 && (
          <ExploitationParcellesPicker
            exploitations={exploitationsWithParcelles}
            addedExploitationIds={parcelles.addedExploitationIds[millesime] ?? []}
            onPick={handleExploitationPick}
          />
        )}
        <p className="fr-text--sm fr-mb-0" aria-live="polite">
          {announcement && (
            <>
              <span className="fr-icon-check-line fr-icon--sm fr-mr-1v" aria-hidden="true" />
              {announcement}
            </>
          )}
        </p>
      </div>
      {selectedParcelles.length === 0 ? (
        <EmptyPlaceholder
          label="Aucune parcelle associée pour le moment"
          illustrativeIcon="fr-icon-collage-line"
        />
      ) : (
        <ul className="flex flex-col gap-2 fr-mb-0" style={{ listStyle: 'none', padding: 0 }}>
          {selectedParcelles.map((parcelle, index) => {
            const exploitationName = getParcelleExploitation(
              parcelle.rpgId,
              millesime,
              projectExploitations
            )?.name
            return (
              <li key={parcelle.rpgId} className="cursor-pointer">
                <ListItem
                  key={parcelle.rpgId}
                  priority={index % 2 === 0 ? 'primary' : 'secondary'}
                  hasBorder
                  variant="compact"
                  title={`Parcelle RPG ${parcelle.rpgId}`}
                  tags={[getCultureByCode(parcelle.cultureCode)]}
                  metas={[
                    {
                      content: `${parcelle?.surface ?? 'Non renseigné'} ha`,
                      iconId: 'fr-icon-ruler-line',
                    },
                    {
                      content: exploitationName ?? 'Hors exploitations du projet',
                      iconId: 'fr-icon-building-line',
                    },
                  ]}
                  onClick={parcelle.centroid ? () => onParcelleClick(parcelle) : undefined}
                />
              </li>
            )
          })}
        </ul>
      )}
    </SectionCard>
  )
}
