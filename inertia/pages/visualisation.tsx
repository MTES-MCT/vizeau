import { ChangeEvent, useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { Head, router, usePage } from '@inertiajs/react'
import { debounce } from 'lodash-es'
import VisualisationMap, { VisualisationMapRef } from '~/components/map/visualisation-map'
import Layout from '~/ui/layouts/Layout'
import MapLayout from '~/ui/layouts/MapLayout'
import VisualisationLeftSideBar from '~/components/visualisation-left-side-bar'

import VisualisationRightSide from '~/components/visualisation-right-side-bar'
import type { AacSummaryJson } from '#types/models'
import type { Data } from '@generated/data'
import { useCulturesFilter } from '~/hooks/use_cultures_filter'
import Select from '@codegouvfr/react-dsfr/SelectNext'
import type { MapGeoJSONFeature } from 'maplibre-gl'
import { urlFor } from '~/client'
import ParcellesWorkspace, { ParcellesSelection } from '~/components/parcelle/parcelles-workspace'
import type { SelectedParcelle } from '~/components/map/parcelles-selection-map'
import { useCheckedAacEmprises } from '~/hooks/use_aac_emprises'
import type { BaseMapId } from '~/components/map/styles/base_maps'
import { readParcelleAgricole } from '~/components/map/styles/parcelles-agricoles'

const toSelectedParcelles = (parcelles: Data.Parcelle[] = []): SelectedParcelle[] =>
  parcelles.flatMap(({ rpgId, surface, cultureCode, centroid }) =>
    rpgId ? [{ rpgId, surface, cultureCode, centroid: centroid ?? undefined }] : []
  )

// Le validateur refuse les null : les valeurs absentes sont omises
const toAssignPayload = ({ rpgId, surface, cultureCode, centroid }: SelectedParcelle) => ({
  rpgId,
  surface: surface ?? undefined,
  cultureCode: cultureCode ?? undefined,
  centroid,
})

const handleSearch = debounce((e: ChangeEvent<HTMLInputElement>) => {
  router.reload({
    only: ['filteredExploitations'],
    data: { recherche: e.target.value },
    replace: true,
  })
}, 300)

export type VisualisationPageProps = {
  filteredExploitations: Data.Exploitation[]
  queryString: Record<string, string | undefined>
  unavailableParcellesIds: string[]
  aacs: AacSummaryJson[]
  aacMeta: {
    total: number
    perPage: number
    currentPage: number
    lastPage: number
  }
  aacQueryString: {
    aacRecherche: string
    aacCommune: string
    aacPage: string
    aacDepassementsReglementaires?: string
    aacDepassementsAlerte?: string
  }
  selectedAac?: AacSummaryJson
  aacSurfaces: Record<string, number | null>
  accessibleAacCodes: string[]
  pmtilesUrl: string
  projects: Data.Project[]
  /** Chargées à l'ouverture de l'éditeur de parcelles seulement. */
  aacEmprises?: Data.Territoire.Variants['forEmprise'][]
}

export default function VisualisationPage({
  filteredExploitations,
  queryString,
  unavailableParcellesIds,
  aacs,
  aacMeta,
  aacQueryString,
  selectedAac,
  aacSurfaces,
  accessibleAacCodes,
  pmtilesUrl,
  projects,
  aacEmprises,
}: VisualisationPageProps) {
  const [isMapLoading, setIsMapLoading] = useState(true)
  const [mapZoom, setMapZoom] = useState<number | null>(null)
  const [showParcelles, setShowParcelles] = useState(true)
  const [showAac, setShowAac] = useState(true)
  const [showPpe, setShowPpe] = useState(false)
  const [showPpr, setShowPpr] = useState(false)
  const [showCommunes, setShowCommunes] = useState(false)
  const [showBioOnly, setShowBioOnly] = useState(false)
  const [showSage, setShowSage] = useState(false)
  const [showBaseMap, setShowBaseMap] = useState(true)
  const mapRef = useRef<VisualisationMapRef>(null)
  const {
    visibleCultures,
    culturesInViewport,
    toggleCulture,
    setAllCulturesVisible,
    handleCulturesInViewportChange,
  } = useCulturesFilter()
  const [style, setStyle] = useState<BaseMapId>('vector')
  // Choisir un fond de carte, c'est vouloir le voir
  const changeStyle = (newStyle: BaseMapId) => {
    setStyle(newStyle)
    setShowBaseMap(true)
  }

  // Selected exploitation in the sidebar
  const [selectedExploitationId, setSelectedExploitationId] = useState<string | undefined>(
    queryString?.exploitationId as string | undefined
  )
  const [selectedExploitationTab, setSelectedExploitationTab] = useState(
    (queryString?.tab as string) || 'general'
  )
  // Edit mode allows selecting multiple parcelles to assign to the exploitation. View mode only shows details of a single parcelle, or a whole exploitation.
  const [editMode, setEditMode] = useState(false)
  const millesime = queryString?.millesime as string
  const { rpgMillesimes } = usePage().props

  // Millésimes chargés au fil de l'édition, conservés pour ne rien perdre en changeant de RPG
  const [loadedSelection, setLoadedSelection] = useState<ParcellesSelection>({})
  const [loadedUnavailableIds, setLoadedUnavailableIds] = useState<Record<string, string[]>>({})
  const [loadingMillesime, setLoadingMillesime] = useState<string | null>(null)
  const [isSubmittingParcelles, setIsSubmittingParcelles] = useState(false)

  // We need to memoize the selected exploitation to avoid unnecessary re-renders
  const selectedExploitation = useMemo(
    () => filteredExploitations.find((exp) => exp.id === selectedExploitationId),
    [selectedExploitationId, filteredExploitations]
  )

  // selectedAac is provided as a server prop, fetched independently of the
  // paginated aacs list so that deep links always resolve correctly.

  // Calculate selected parcelle from query params
  const selectedParcelle = useMemo(() => {
    const parcelleIdFromQuery = queryString?.parcelleId as string | undefined
    if (!parcelleIdFromQuery || !selectedExploitation?.parcelles) return undefined
    return selectedExploitation.parcelles.find((p) => p.rpgId === parcelleIdFromQuery)
  }, [queryString?.parcelleId, selectedExploitation])

  useEffect(() => {
    if (!editMode || !selectedExploitation) return
    setLoadedSelection((previous) =>
      millesime in previous
        ? previous
        : { ...previous, [millesime]: toSelectedParcelles(selectedExploitation.parcelles) }
    )
  }, [editMode, selectedExploitation, millesime])

  useEffect(() => {
    if (!editMode) return
    setLoadedUnavailableIds((previous) => ({ ...previous, [millesime]: unavailableParcellesIds }))
  }, [editMode, unavailableParcellesIds, millesime])

  useEffect(() => {
    if (editMode) return
    setLoadedSelection({})
    setLoadedUnavailableIds({})
  }, [editMode])

  const exploitationTerritoireIds = useMemo(
    () => selectedExploitation?.territoires?.map((territoire) => territoire.id) ?? [],
    [selectedExploitation]
  )
  const workspaceAacs = useCheckedAacEmprises(aacEmprises, exploitationTerritoireIds)
  const [isWorkspaceLoading, setIsWorkspaceLoading] = useState(false)

  // La carte de l'éditeur fige sa vue initiale à son montage : on attend les AAC pour l'ouvrir
  const openParcellesWorkspace = () => {
    if (aacEmprises) {
      setEditMode(true)
      return
    }
    router.reload({
      only: ['aacEmprises'],
      onStart: () => setIsWorkspaceLoading(true),
      onSuccess: () => setEditMode(true),
      onFinish: () => setIsWorkspaceLoading(false),
    })
  }

  const isWorkspaceOpen = editMode && selectedExploitation !== undefined

  // Ouverture directe de l'éditeur via ?workspace=parcelles, une seule fois
  const hasOpenedWorkspaceFromQueryRef = useRef(false)
  useEffect(() => {
    if (hasOpenedWorkspaceFromQueryRef.current) return
    if (queryString?.workspace !== 'parcelles' || !selectedExploitation) return
    hasOpenedWorkspaceFromQueryRef.current = true
    openParcellesWorkspace()
  }, [queryString?.workspace, selectedExploitation])

  const layersSettings = (
    <VisualisationRightSide
      showParcelles={showParcelles}
      setShowParcelles={() => setShowParcelles((prev) => !prev)}
      showAac={showAac}
      setShowAac={() => setShowAac((prev) => !prev)}
      showPpe={showPpe}
      setShowPpe={() => setShowPpe((prev) => !prev)}
      showPpr={showPpr}
      setShowPpr={() => setShowPpr((prev) => !prev)}
      showCommunes={showCommunes}
      setShowCommunes={() => setShowCommunes((prev) => !prev)}
      showBioOnly={showBioOnly}
      setShowBioOnly={() => setShowBioOnly((prev) => !prev)}
      showSage={showSage}
      setShowSage={() => setShowSage((prev) => !prev)}
      showBaseMap={showBaseMap}
      setShowBaseMap={() => setShowBaseMap((prev) => !prev)}
      canSwitchToBioOnly={!editMode}
      parcellesZoomDisabled={mapZoom !== null && mapZoom < 10}
      visibleCultures={visibleCultures}
      onToggleCulture={toggleCulture}
      onSetAllCulturesVisible={setAllCulturesVisible}
      culturesInViewport={culturesInViewport}
    />
  )

  const handleWorkspaceMillesimeChange = (newMillesime: string) => {
    if (newMillesime in loadedSelection) return
    setLoadingMillesime(newMillesime)
    router.reload({
      only: ['queryString', 'filteredExploitations', 'unavailableParcellesIds'],
      data: { exploitationId: selectedExploitationId, millesime: newMillesime },
      onFinish: () => setLoadingMillesime(null),
    })
  }

  // La route n'accepte qu'un millésime à la fois
  const handleWorkspaceSubmit = (selection: ParcellesSelection, changedMillesimes: string[]) => {
    if (!selectedExploitationId) return
    setIsSubmittingParcelles(true)
    const saveNext = ([year, ...remaining]: string[]) => {
      if (!year) {
        setIsSubmittingParcelles(false)
        setEditMode(false)
        return
      }
      router.post(
        urlFor('visualisation.assignParcellesToExploitation'),
        {
          exploitationId: selectedExploitationId,
          year: Number(year),
          parcelles: (selection[year] ?? []).map(toAssignPayload),
        },
        {
          preserveState: true,
          preserveScroll: true,
          only: ['filteredExploitations'],
          onSuccess: () => saveNext(remaining),
          onError: () => setIsSubmittingParcelles(false),
        }
      )
    }
    saveNext(changedMillesimes)
  }

  /*
   * Map events handlers. We need stable references for these callbacks to avoid detaching and reattaching event listeners on each render.
   */
  const handleParcelleClick: (parcelleFeature: MapGeoJSONFeature) => void = useCallback(
    (parcelleFeature) => {
      const newId = readParcelleAgricole(parcelleFeature)?.rpgId

      // Find the exploitation that owns this parcelle and navigate to it
      const owningExploitation = filteredExploitations.find((exp) =>
        exp.parcelles?.some((p) => p.rpgId === newId)
      )

      if (owningExploitation) {
        // Navigate to the exploitation with the parcelle selected
        router.visit(
          `/visualisation?exploitationId=${owningExploitation.id}&parcelleId=${newId}&millesime=${millesime}`,
          {
            preserveState: true,
            preserveScroll: true,
            only: ['queryString'],
          }
        )
        setSelectedExploitationTab('parcelles')
      }
    },
    [filteredExploitations, millesime]
  )

  const handleMarkerClick = useCallback((exploitation: Data.Exploitation) => {
    setSelectedExploitationId(exploitation.id)
    mapRef.current?.centerOnExploitation(exploitation)
  }, [])

  // Opens the clicked AAC in the sidebar, like its link in the AAC list does.
  const handleAacClick = useCallback(
    (aacCode: string) => {
      router.visit(`/visualisation?aacCode=${aacCode}&millesime=${millesime}`, {
        preserveState: true,
        preserveScroll: true,
      })
    },
    [millesime]
  )

  // When edit mode changes, we need to refresh the unavailable parcelles from the server.
  useEffect(() => {
    if (!selectedExploitationId) return

    // When entering edit mode, we query unavailable parcelles for the selected exploitation
    if (editMode) {
      router.reload({
        only: ['unavailableParcellesIds'],
        data: {
          exploitationId: selectedExploitationId,
          millesime,
        },
        replace: true,
      })
    }
    // Else when exiting edit mode, we clear the unavailable parcelles
    else {
      router.reload({
        only: ['unavailableParcellesIds'],
        data: {
          exploitationId: undefined,
          millesime,
        },
        replace: true,
      })
    }
  }, [editMode, millesime, selectedExploitationId])

  // Handle initial selection from query params (e.g., when coming from a parcelle link)
  // This effect only runs when the URL query params change, not when local state changes
  const prevQueryExploitationIdRef = useRef<string | undefined>(undefined)
  const prevQueryParcelleIdRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    const exploitationIdFromQuery = queryString?.exploitationId as string | undefined
    const parcelleIdFromQuery = queryString?.parcelleId as string | undefined

    // Only process if query params actually changed (not on every state update)
    const queryExploitationChanged = prevQueryExploitationIdRef.current !== exploitationIdFromQuery
    const queryParcelleChanged = prevQueryParcelleIdRef.current !== parcelleIdFromQuery

    prevQueryExploitationIdRef.current = exploitationIdFromQuery
    prevQueryParcelleIdRef.current = parcelleIdFromQuery

    if (!queryExploitationChanged && !queryParcelleChanged) {
      return
    }

    if (exploitationIdFromQuery && filteredExploitations.length > 0) {
      const exploitation = filteredExploitations.find((exp) => exp.id === exploitationIdFromQuery)

      if (exploitation) {
        setSelectedExploitationId(exploitationIdFromQuery)

        // Update selected tab from URL parameters
        if (parcelleIdFromQuery) {
          setSelectedExploitationTab('parcelles')
        } else {
          const tabFromQuery = queryString?.tab as string | undefined
          setSelectedExploitationTab(tabFromQuery || 'general')
        }

        // Center on exploitation or parcelle when URL changes
        if (parcelleIdFromQuery && exploitation.parcelles) {
          const parcelle = exploitation.parcelles.find((p) => p.rpgId === parcelleIdFromQuery)
          if (parcelle) {
            mapRef.current?.centerOnParcelle(parcelle)
          } else {
            mapRef.current?.centerOnExploitation(exploitation)
          }
        } else {
          mapRef.current?.centerOnExploitation(exploitation)
        }
      }
    } else if (!exploitationIdFromQuery) {
      // If no exploitation in URL, clear selection
      setSelectedExploitationId(undefined)
    }
  }, [
    queryString?.exploitationId,
    queryString?.parcelleId,
    queryString?.tab,
    filteredExploitations,
  ])

  // Center on AAC when selected
  useEffect(() => {
    if (selectedAac) {
      mapRef.current?.centerOnAac(selectedAac)
    }
  }, [selectedAac])

  // Center on explicit centroid from URL when provided (e.g. deep-link from project parcelles list)
  useEffect(() => {
    const centroidXParam = queryString?.centroidX as string | undefined
    const centroidYParam = queryString?.centroidY as string | undefined

    if (!centroidXParam || !centroidYParam) {
      return
    }

    const x = Number.parseFloat(centroidXParam)
    const y = Number.parseFloat(centroidYParam)

    if (Number.isNaN(x) || Number.isNaN(y)) {
      return
    }

    mapRef.current?.centerOnCoordinates({ x, y })
  }, [queryString?.centroidX, queryString?.centroidY])

  return (
    <Layout isMapLayout={true} hideFooter={true}>
      <Head title="Carte" />
      {isWorkspaceOpen && (
        <ParcellesWorkspace
          variant="inline"
          isOpen
          title={`Gérer les parcelles · ${selectedExploitation!.name}`}
          selectionTitle="Parcelles de l’exploitation"
          initialSelection={loadedSelection}
          defaultMillesime={millesime}
          aacs={workspaceAacs}
          mapFocus={{ territoireIds: exploitationTerritoireIds }}
          pmtilesUrl={pmtilesUrl}
          layers={{
            map: {
              showParcelles,
              showAac,
              showPpe,
              showPpr,
              showCommunes,
              showSage,
              showBaseMap,
              onShowBaseMapChange: setShowBaseMap,
              visibleCultures,
              onCulturesInViewportChange: handleCulturesInViewportChange,
              onZoomChange: setMapZoom,
            },
            panel: layersSettings,
          }}
          baseMap={style}
          onBaseMapChange={changeStyle}
          unavailableRpgIds={loadedUnavailableIds}
          onMillesimeChange={handleWorkspaceMillesimeChange}
          isMillesimeLoading={loadingMillesime !== null}
          submitLabel="Enregistrer les parcelles"
          isSubmitting={isSubmittingParcelles}
          onSubmit={handleWorkspaceSubmit}
          onClose={() => setEditMode(false)}
        />
      )}
      {/* Gardée montée pendant l'édition pour retrouver la carte telle quelle */}
      <div className={isWorkspaceOpen ? 'hidden' : 'contents'}>
        <MapLayout
          pageName="Exploitations agricoles et AAC"
          leftContent={
            <VisualisationLeftSideBar
              exploitations={filteredExploitations}
              handleSearch={handleSearch}
              queryString={queryString}
              selectedExploitation={selectedExploitation}
              selectedParcelle={selectedParcelle}
              selectedExploitationTab={selectedExploitationTab}
              setSelectedExploitationTab={setSelectedExploitationTab}
              isMapLoading={isMapLoading}
              mapRef={mapRef}
              onAssignParcelles={openParcellesWorkspace}
              isAssignParcellesLoading={isWorkspaceLoading}
              showBioOnly={showBioOnly}
              millesime={millesime}
              aacs={aacs}
              aacMeta={aacMeta}
              aacQueryString={aacQueryString}
              selectedAac={selectedAac ?? undefined}
            />
          }
          headerAdditionalContent={
            <div className="flex flex-1 items-center justify-between gap-4">
              <div className="flex items-center gap-4 w-fit">
                <Select
                  className="w-fit pointer-events-auto fr-mb-0"
                  label=""
                  nativeSelectProps={{
                    value: style,
                    onChange: (e) => changeStyle(e.target.value as BaseMapId),
                  }}
                  options={[
                    { value: 'vector', label: 'Carte vectorielle' },
                    { value: 'orthophoto', label: 'Photographie aérienne' },
                    { value: 'plan-ign', label: 'Plan IGN' },
                  ]}
                />
                <Select
                  // Non contrôlé : recréé quand l'éditeur change le millésime
                  key={millesime}
                  className="w-fit pointer-events-auto fr-mb-0"
                  style={{ width: 'fit-content' }}
                  label=""
                  nativeSelectProps={{
                    defaultValue: millesime,
                    onChange: (e) => {
                      // Reload the page with the new millesime
                      // This operation can take some time on slow connections, so we set the map in loading state
                      // It will be unset when the map 'idle' event is fired
                      setIsMapLoading(true)
                      router.reload({
                        only: ['queryString', 'filteredExploitations'],
                        data: {
                          exploitationId: selectedExploitation?.id,
                          millesime: e.target.value,
                        },
                      })
                    },
                  }}
                  options={rpgMillesimes.map((value) => ({ value, label: `RPG ${value}` }))}
                />
              </div>
            </div>
          }
          map={
            <VisualisationMap
              exploitations={filteredExploitations}
              selectedExploitation={selectedExploitation}
              selectedParcelle={selectedParcelle}
              selectedParcelleId={queryString?.parcelleId as string | undefined}
              isMapLoading={isMapLoading}
              setIsMapLoading={setIsMapLoading}
              onParcelleClick={handleParcelleClick}
              onMarkerClick={handleMarkerClick}
              onAacClick={handleAacClick}
              selectedAacCode={selectedAac?.code}
              millesime={millesime}
              showParcelles={showParcelles}
              showAac={showAac}
              showPpe={showPpe}
              showPpr={showPpr}
              showCommunes={showCommunes}
              showBioOnly={showBioOnly}
              showSage={showSage}
              showBaseMap={showBaseMap}
              ref={mapRef}
              visibleCultures={visibleCultures}
              style={style}
              onZoomChange={setMapZoom}
              onCulturesInViewportChange={handleCulturesInViewportChange}
              pmtilesUrl={pmtilesUrl}
              projects={projects}
              aacSurfaces={aacSurfaces}
              accessibleAacCodes={accessibleAacCodes}
            />
          }
          rightContent={layersSettings}
        />
      </div>
    </Layout>
  )
}
