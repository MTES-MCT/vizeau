import { RefObject } from 'react'
import { fr } from '@codegouvfr/react-dsfr'
import Breadcrumb from '@codegouvfr/react-dsfr/Breadcrumb'
import { Link, router } from '@inertiajs/react'
import { AacSummaryJson } from '../../../types/models'
import { VisualisationMapRef } from '~/components/map/VisualisationMap'
import AacInformationsCard from '../aac-id/aac-informations-card'
import AacCulturesRepartition from '../aac-id/aac-cultures-repartition'
import SmallSection from '~/ui/SmallSection'

export type AacLeftSidebarProps = {
  aac: AacSummaryJson
  mapRef: RefObject<VisualisationMapRef | null>
  millesime: string
}

export default function AacLeftSidebar({ aac, millesime }: AacLeftSidebarProps) {
  return (
    <div className="fr-p-1w">
      <Breadcrumb
        currentPageLabel={aac.nom}
        segments={[
          {
            label: 'Liste des AAC',
            linkProps: {
              href: '#',
              onClick: () => {
                router.visit(`/visualisation?millesime=${millesime}&tab=aac`)
              },
              style: {
                cursor: 'pointer',
                fontSize: 'inherit',
                color: 'inherit',
              },
            },
          },
        ]}
        className={'fr-my-0'}
      />

      <div
        className="fr-p-1w fr-m-1w"
        style={{ background: fr.colors.decisions.background.alt.blueFrance.default }}
      >
        <div
          className="flex items-center gap-2 fr-mb-2w"
          style={{ color: fr.colors.decisions.text.actionHigh.blueFrance.default }}
        >
          <span className="fr-icon-arrow-right-line" aria-hidden="true" />

          <h4 className="fr-m-0 font-bold fr-text--lead underline" style={{ color: 'inherit' }}>
            <Link href={`/aac/${aac.code}`} style={{ backgroundImage: 'none' }}>
              {aac.nom}
            </Link>
          </h4>
        </div>

        <div className="flex flex-col gap-4">
          <AacInformationsCard {...aac} extented />
          <SmallSection
            title="Répartition des cultures"
            iconId="fr-icon-leaf-line"
            priority="secondary"
            hasBorder
          >
            <AacCulturesRepartition {...aac} />
          </SmallSection>
        </div>
      </div>
    </div>
  )
}
