import ListItem from '~/ui/ListItem'
import type { ParcelleJson } from '#types/models'
import { getCultureByCode } from '~/functions/cultures-group'

import EmptyPlaceholder from '~/ui/EmptyPlaceholder'

export type ProjetParcellesListProps = {
  parcelles: ParcelleJson[]
}

export default function ProjetParcellesList({ parcelles }: ProjetParcellesListProps) {
  if (parcelles.length === 0) {
    return (
      <EmptyPlaceholder illustrativeIcon="fr-icon-collage-fill" label="Aucune parcelle associée" />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {parcelles.map((parcelle) => {
        const visualisationHref = parcelle.centroid
          ? `/visualisation?millesime=${parcelle.year}&parcelleId=${parcelle.rpgId}&centroidX=${parcelle.centroid.x}&centroidY=${parcelle.centroid.y}`
          : `/visualisation?millesime=${parcelle.year}&parcelleId=${parcelle.rpgId}`

        return (
          <ListItem
            key={`${parcelle.rpgId}-${parcelle.year}`}
            hasBorder
            variant="compact"
            linkProps={{ href: visualisationHref }}
            title={`Parcelle RPG ${parcelle.rpgId}`}
            tags={[getCultureByCode(parcelle.cultureCode)]}
            metas={[
              {
                content: `${parcelle.surface ?? 'Non renseigné'} ha`,
                iconId: 'fr-icon-ruler-line',
              },
              { content: parcelle.year.toString(), iconId: 'fr-icon-calendar-line' },
              ...(parcelle.comment
                ? [
                    {
                      content: 'Commentaire',
                      iconId: 'fr-icon-draft-line',
                    },
                  ]
                : []),
            ]}
          />
        )
      })}
    </div>
  )
}
