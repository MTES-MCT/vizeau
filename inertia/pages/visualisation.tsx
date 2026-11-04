import { ChangeEvent, useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { Head, router, useForm } from '@inertiajs/react'
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
import { getCentroid } from '~/functions/map'
import { urlFor } from '~/client'
import type { ParcellesState, StepParcelle } from '~/functions/parcelles'
import {
  emptyParcellesState,
  getActiveParcelles,
  getYearParcelles,
  parcellesStateFromExploitation,
} from '~/functions/parcelles'
import { useMapParcelleToggle } from '~/hooks/use_map_parcelle_toggle'

const handleSearch = debounce((e: ChangeEvent<HTMLInputElement>) => {
  router.reload({
    only: ['filteredExploitations'],
    data: { recherche: e.target.value },
    replace: true,
  })
}, 300)

export type ParcelleFormData = {
  parcelles: ParcellesState
}

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
  const mapRef = useRef<VisualisationMapRef>(null)
  const {
    visibleCultures,
    culturesInViewport,
    toggleCulture,
    setAllCulturesVisible,
    handleCulturesInViewportChange,
  } = useCulturesFilter()
  const [style, setStyle] = useState<string>('vector')

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

  const { data, setData, post, processing, transform } = useForm<ParcelleFormData>({
    parcelles: emptyParcellesState(),
  })

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

  const setParcelles = useCallback(
    (updater: (prev: ParcellesState) => ParcellesState) => {
      setData((prev) => ({ ...prev, parcelles: updater(prev.parcelles) }))
    },
    [setData]
  )

  const { toggleParcelle, pacageSuggestion, dismissPacageSuggestion } = useMapParcelleToggle(
    data.parcelles,
    setParcelles,
    millesime
  )

  // Parcelles cochées du millésime affiché, seules envoyées au serveur.
  const formParcelles = useMemo(
    () =>
      getActiveParcelles(getYearParcelles(data.parcelles, Number(millesime))).filter(
        (parcelle): parcelle is StepParcelle & { rpgId: string } => parcelle.rpgId !== null
      ),
    [data.parcelles, millesime]
  )

  const formParcelleIds = useMemo(
    () => formParcelles.map((parcelle) => parcelle.rpgId),
    [formParcelles]
  )

  // L'onglet actif ou le PACAGE rattaché à une parcelle ne sont pas des modifications :
  // seul compte l'ensemble des parcelles cochées, comparé à celles déjà rattachées.
  const isDirty = useMemo(() => {
    const savedIds = new Set(
      (selectedExploitation?.parcelles ?? [])
        .filter((parcelle) => parcelle.year.toString() === millesime && parcelle.rpgId)
        .map((parcelle) => parcelle.rpgId)
    )
    return (
      savedIds.size !== formParcelleIds.length || formParcelleIds.some((id) => !savedIds.has(id))
    )
  }, [selectedExploitation, millesime, formParcelleIds])

  const startEditMode = () => {
    setData(
      'parcelles',
      parcellesStateFromExploitation(
        selectedExploitation?.parcelles?.filter((p) => p.year.toString() === millesime)
      )
    )
    dismissPacageSuggestion()
    setSelectedExploitationTab('parcelles')
    setEditMode(true)
  }

  const cancelEditMode = () => {
    setData('parcelles', emptyParcellesState())
    setEditMode(false)
  }

  // Prepare data before sending the form
  transform(() => ({
    exploitationId: selectedExploitationId || null,
    year: parseInt(millesime, 10),
    parcelles: formParcelles.map(({ rpgId, surface, cultureCode, centroid }) => ({
      rpgId,
      surface,
      cultureCode,
      centroid,
    })),
  }))

  const sendFormAndResetState = (onAfterSuccess?: () => void) => {
    post(urlFor('visualisation.assignParcellesToExploitation'), {
      preserveState: true,
      onSuccess: () => {
        setEditMode(false)
        onAfterSuccess?.()
      },
      // Reload the exploitations to get updated parcelle data
      only: ['filteredExploitations'],
    })
  }

  /*
   * Map events handlers. We need stable references for these callbacks to avoid detaching and reattaching event listeners on each render.
   */
  const handleParcelleClick: (parcelleFeature: MapGeoJSONFeature) => void = useCallback(
    (parcelleFeature) => {
      const properties = parcelleFeature.properties || {}
      const newId = properties['id_parcel'] || properties['ID_PARCEL']

      // In edit mode, we can select multiple parcelles to attach them to the exploitation
      if (editMode && selectedExploitationId) {
        toggleParcelle({
          rpgId: String(newId),
          surface:
            properties['surf_parc'] != null ? properties['surf_parc'] : properties['SURF_PARC'],
          cultureCode: properties['code_cultu'] || properties['CODE_CULTU'],
          centroid: getCentroid(parcelleFeature.geometry),
        })
      } else {
        // In view mode, find the exploitation that owns this parcelle and navigate to it
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
      }
    },
    [editMode, selectedExploitationId, toggleParcelle, filteredExploitations, millesime]
  )

  const handleMarkerClick = useCallback(
    (exploitation: Data.Exploitation) => {
      if (!editMode) {
        setSelectedExploitationId(exploitation.id)
        mapRef.current?.centerOnExploitation(exploitation)
      }
    },
    [editMode]
  )

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
            editMode={editMode}
            mapRef={mapRef}
            isDirty={isDirty}
            processing={processing}
            sendFormAndResetState={sendFormAndResetState}
            startEditMode={startEditMode}
            cancelEditMode={cancelEditMode}
            parcelles={data.parcelles}
            setParcelles={setParcelles}
            pacageSuggestion={pacageSuggestion}
            dismissPacageSuggestion={dismissPacageSuggestion}
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
                  defaultValue: 'vector',
                  onChange: (e) => setStyle(e.target.value),
                }}
                options={[
                  { value: 'vector', label: 'Carte vectorielle' },
                  { value: 'orthophoto', label: 'Photographie aérienne' },
                  { value: 'plan-ign', label: 'Plan IGN' },
                ]}
              />
              <Select
                className="w-fit pointer-events-auto fr-mb-0"
                style={{ width: 'fit-content' }}
                label=""
                disabled={editMode}
                nativeSelectProps={{
                  defaultValue: millesime,
                  onChange: (e) => {
                    // Reload the page with the new millesime
                    // This operation can take some time on slow connections, so we set the map in loading state
                    // It will be unset when the map 'idle' event is fired
                    setIsMapLoading(true)
                    router.reload({
                      only: ['queryString', 'filteredExploitations'],
                      data: { exploitationId: selectedExploitation?.id, millesime: e.target.value },
                    })
                  },
                }}
                options={[
                  { value: '2024', label: 'RPG 2024' },
                  { value: '2023', label: 'RPG 2023' },
                  { value: '2022', label: 'RPG 2022' },
                  { value: '2021', label: 'RPG 2021' },
                  { value: '2020', label: 'RPG 2020' },
                ]}
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
            formParcelleIds={formParcelleIds}
            unavailableParcelleIds={unavailableParcellesIds}
            millesime={millesime}
            editMode={editMode}
            showParcelles={showParcelles}
            showAac={showAac}
            showPpe={showPpe}
            showPpr={showPpr}
            showCommunes={showCommunes}
            showBioOnly={showBioOnly}
            showSage={showSage}
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
        rightContent={
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
            canSwitchToBioOnly={!editMode}
            parcellesZoomDisabled={mapZoom !== null && mapZoom < 10}
            visibleCultures={visibleCultures}
            onToggleCulture={toggleCulture}
            onSetAllCulturesVisible={setAllCulturesVisible}
            culturesInViewport={culturesInViewport}
          />
        }
      />
    </Layout>
  )
}
