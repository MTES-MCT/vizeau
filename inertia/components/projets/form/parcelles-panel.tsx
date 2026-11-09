import SectionCard from '~/ui/SectionCard'
import ListItem from '~/ui/ListItem'
import EmptyPlaceholder from '~/ui/EmptyPlaceholder'
import { getCultureByCode } from '~/functions/cultures_group'
import {
  getParcelleExploitation,
  getSelectedParcelles,
  type ProjetExploitation,
} from '~/functions/projet_parcelles'
import type { ProjetParcellesFormData, SelectedParcelleFormData } from './projet-form'

type ParcellesPanelProps = {
  parcelles: ProjetParcellesFormData
  projectExploitations: ProjetExploitation[]
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
  onParcelleClick,
}: ParcellesPanelProps) {
  const selectedParcelles = getSelectedParcelles(parcelles)

  return (
    <SectionCard title="Parcelles sélectionnées" icon="fr-icon-map-pin-2-line" size="small">
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
              parcelles.millesime,
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
