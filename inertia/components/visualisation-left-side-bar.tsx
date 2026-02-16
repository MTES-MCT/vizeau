import { ChangeEvent, RefObject } from 'react'
import { ExploitationJson, ParcelleJson } from '../../types/models'
import { VisualisationMapRef } from '~/components/map/VisualisationMap'
import ExploitationLeftSidebar from './exploitation-id/exploitation-left-sidebar'
import ParcelleLeftSidebar from './parcelle/parcelle-left-sidebar'

export default function VisualisationLeftSideBar({
  exploitations,
  queryString,
  handleSearch,
  selectedExploitation,
  setSelectedExploitationId,
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
}: {
  exploitations: ExploitationJson[]
  queryString?: { recherche?: string }
  handleSearch: (e: ChangeEvent<HTMLInputElement>) => void
  selectedExploitation?: ExploitationJson
  setSelectedExploitationId: (exploitationId: string | undefined) => void
  selectedParcelle: ParcelleJson | undefined
  selectedExploitationTab: string
  setSelectedExploitationTab: (tab: string) => void
  isMapLoading: boolean
  editMode: boolean
  mapRef: RefObject<VisualisationMapRef>
  setData: any
  setDefaults: any
  setEditMode: any
  showBioOnly: boolean
  millesime: string
  isDirty: boolean
  processing: boolean
  reset: any
  sendFormAndResetState: any
}) {
  return (
    <div>
      {selectedParcelle ? (
        <ParcelleLeftSidebar
          parcelle={selectedParcelle}
          exploitation={selectedExploitation}
          editMode={editMode}
          setSelectedExploitationTab={setSelectedExploitationTab}
        />
      ) : (
        <ExploitationLeftSidebar
          exploitations={exploitations}
          queryString={queryString}
          selectedExploitation={selectedExploitation}
          setSelectedExploitationId={setSelectedExploitationId}
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
    </div>
  )
}
