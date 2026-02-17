import { RefObject } from 'react'
import { fr } from '@codegouvfr/react-dsfr'
import Breadcrumb from '@codegouvfr/react-dsfr/Breadcrumb'
import { router } from '@inertiajs/react'
import { ParcelleJson } from '../../../types/models'
import { VisualisationMapRef } from '~/components/map/VisualisationMap'
import SmallSection from '~/ui/SmallSection'
import LabelInfo from '~/ui/LabelInfo'
import cultures from '../../../database/data/cultures.json'
import CustomTag from '~/ui/CustomTag'
import Button from '@codegouvfr/react-dsfr/Button'

export type ParcelleLeftSidebarProps = {
  parcelle: ParcelleJson
  exploitation: any
  editMode: boolean
  mapRef: RefObject<VisualisationMapRef>
}

export default function ParcelleLeftSidebar({
  parcelle,
  exploitation,
  mapRef,
}: ParcelleLeftSidebarProps) {
  const cultureLabel = cultures.find((culture) => culture.code === parcelle.cultureCode)?.label

  return (
    <div className="fr-p-1w">
      <Breadcrumb
        currentPageLabel={parcelle.rpgId}
        segments={[
          {
            label: 'Liste des exploitations agricoles',
            linkProps: {
              href: '#',
              onClick: () => {
                router.visit('/visualisation')
              },
              style: {
                cursor: 'pointer',
                fontSize: 'inherit',
                color: 'inherit',
              },
            },
          },
          {
            label: exploitation.name,
            linkProps: {
              href: '#',
              onClick: () => {
                router.visit(
                  `/visualisation?exploitationId=${exploitation.id}&millesime=${parcelle.year}&tab=parcelles`,
                  {
                    preserveScroll: true,
                  }
                )
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
        {parcelle.rpgId && <h4 className="fr-h3">{`Parcelle RPG ${parcelle.rpgId}`}</h4>}

        <div
          className="fr-mb-3v fr-pb-3v"
          style={{
            borderBottom: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
          }}
        >
          <Button
            priority="secondary"
            size="small"
            iconId="fr-icon-crosshair-2-line"
            className="flex justify-center"
            onClick={() => mapRef.current?.centerOnParcelle(parcelle)}
            style={{ whiteSpace: 'nowrap', width: '100%' }}
          >
            Centrer sur la parcelle
          </Button>
        </div>

        <SmallSection
          title="Informations générales"
          iconId="fr-icon-pass-pending-line"
          priority="secondary"
          hasBorder
        >
          <div className="flex flex-col gap-2">
            <LabelInfo
              label="Type de culture"
              size="sm"
              icon="fr-icon-plant-line"
              info={cultureLabel ? <CustomTag label={cultureLabel} /> : 'N/A'}
            />

            <LabelInfo
              label="Année de déclaration"
              size="sm"
              icon="fr-icon-calendar-line"
              info={`${parcelle.year || 'N/A'}`}
            />

            <LabelInfo
              label="Surface admissible PAC"
              size="sm"
              icon="fr-icon-ruler-line"
              info={`${parcelle?.surface || 'N/A'} ha`}
            />
          </div>
        </SmallSection>
      </div>
    </div>
  )
}
