import { ChangeEvent, RefObject, useState } from 'react'
import { ExploitationJson, ParcelleJson } from '../../types/models'
import { VisualisationMapRef } from '~/components/map/VisualisationMap'
import ExploitationLeftSidebar from './exploitation-id/exploitation-left-sidebar'
import ParcelleLeftSidebar from './parcelle/parcelle-left-sidebar'
import { SegmentedControl } from '@codegouvfr/react-dsfr/SegmentedControl'
import { fr } from '@codegouvfr/react-dsfr'
import AACsLeftSidebar from './aacs/aacs-left-sidebar'

export default function VisualisationLeftSideBar({
  exploitations,
  queryString,
  handleSearch,
  selectedExploitation,
  selectedParcelle,
  selectedExploitationTab,
  setSelectedExploitationTab,
  isMapLoading,
  editMode,
  mapRef,
  setData,
  setDefaults,
  setEditMode,
  showBioOnly,
  millesime,
  isDirty,
  processing,
  reset,
  sendFormAndResetState,
  aacs,
  aacMeta,
  aacQueryString,
}: {
  exploitations: ExploitationJson[]
  queryString?: { recherche?: string }
  handleSearch: (e: ChangeEvent<HTMLInputElement>) => void
  selectedExploitation?: ExploitationJson
  selectedParcelle: ParcelleJson | undefined
  selectedExploitationTab: string
  setSelectedExploitationTab: (tab: string) => void
  isMapLoading: boolean
  editMode: boolean
  mapRef: RefObject<VisualisationMapRef | null>
  setData: any
  setDefaults: any
  setEditMode: any
  showBioOnly: boolean
  millesime: string
  isDirty: boolean
  processing: boolean
  reset: any
  sendFormAndResetState: any
  aacs: any[]
  aacMeta: { total: number; perPage: number; currentPage: number; lastPage: number }
  aacQueryString: { aacRecherche: string; aacCommune: string; aacPage: string }
}) {
  const [tab, setTab] = useState(() =>
    aacQueryString?.aacRecherche ||
    aacQueryString?.aacCommune ||
    (aacQueryString?.aacPage && aacQueryString.aacPage !== '1')
      ? 'aac'
      : 'exploitation'
  )

  return (
    <div>
      {selectedParcelle && selectedExploitation ? (
        <ParcelleLeftSidebar
          parcelle={selectedParcelle}
          exploitation={selectedExploitation}
          mapRef={mapRef}
        />
      ) : (
        <div>
          <div
            className="fr-p-2v fr-mb-2v"
            style={{
              backgroundColor: fr.colors.decisions.background.default.grey.default,
              boxShadow: `0 4px 6px 0 rgba(0, 0, 0, 0.10)`,
            }}
          >
            <SegmentedControl
              hideLegend
              segments={[
                {
                  label: 'Exploitations',
                  nativeInputProps: {
                    checked: tab === 'exploitation',
                    onChange: () => setTab('exploitation'),
                  },
                },
                {
                  label: 'AAC',
                  nativeInputProps: {
                    checked: tab === 'aac',
                    onChange: () => setTab('aac'),
                  },
                },
              ]}
            />
          </div>

          {tab === 'exploitation' && (
            <ExploitationLeftSidebar
              exploitations={exploitations}
              queryString={queryString}
              selectedExploitation={selectedExploitation}
              isMapLoading={isMapLoading}
              handleSearch={handleSearch}
              selectedExploitationTab={selectedExploitationTab}
              setSelectedExploitationTab={setSelectedExploitationTab}
              editMode={editMode}
              mapRef={mapRef}
              setData={setData}
              setDefaults={setDefaults}
              setEditMode={setEditMode}
              showBioOnly={showBioOnly}
              millesime={millesime}
              isDirty={isDirty}
              processing={processing}
              reset={reset}
              sendFormAndResetState={sendFormAndResetState}
            />
          )}

          {tab === 'aac' && (
            <AACsLeftSidebar aacs={aacs} queryString={aacQueryString} meta={aacMeta} />
          )}
        </div>
      )}
    </div>
  )
}
