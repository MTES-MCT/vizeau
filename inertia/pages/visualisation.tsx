import { ChangeEvent, useCallback, useEffect, useMemo, useState, useRef } from 'react'
import { Head, router, useForm } from '@inertiajs/react'
import { debounce } from 'lodash-es'
import VisualisationMap, { VisualisationMapRef } from '~/components/map/VisualisationMap'
import Layout from '~/ui/layouts/layout'
import MapLayout from '~/ui/layouts/MapLayout'
import VisualisationLeftSideBar from '~/components/visualisation-left-side-bar'
import VisualisationController from '#controllers/visualisation_controller'
import { InferPageProps } from '@adonisjs/inertia/types'
import VisualisationRightSide from '~/components/visualisation-right-side-bar'
import { ExploitationJson } from '../../types/models'
import { GROUPES_CULTURAUX } from '~/functions/cultures-group'
import Select from '@codegouvfr/react-dsfr/SelectNext'
import { MapGeoJSONFeature } from 'maplibre-gl'
import { getCentroid } from '~/functions/map'

const handleSearch = debounce((e: ChangeEvent<HTMLInputElement>) => {
  router.reload({
    only: ['filteredExploitations'],
    data: { recherche: e.target.value },
    replace: true,
  })
}, 300)

export type ParcelleFormData = {
  parcelles: {
    rpgId: string
    surface: number | null
    cultureCode: string | null
    centroid: { x: number; y: number } | undefined
  }[]
}

export default function VisualisationPage({
  filteredExploitations,
  queryString,
  assignParcellesToExploitationUrl,
  unavailableParcellesIds,
}: InferPageProps<VisualisationController, 'index'>) {
  const [isMapLoading, setIsMapLoading] = useState(true)
  const [showParcelles, setShowParcelles] = useState(true)
  const [showAac, setShowAac] = useState(true)
  const [showPpe, setShowPpe] = useState(false)
  const [showPpr, setShowPpr] = useState(false)
  const [showCommunes, setShowCommunes] = useState(false)
  const [showBioOnly, setShowBioOnly] = useState(false)
  const mapRef = useRef<VisualisationMapRef>(null)
  const [visibleCultures, setVisibleCultures] = useState<string[]>(Object.keys(GROUPES_CULTURAUX))
  const [style, setStyle] = useState<string>('vector')

  // Selected exploitation in the sidebar
  const [selectedExploitationId, setSelectedExploitationId] = useState<string | undefined>(
    undefined
  )
  // Edit mode allows selecting multiple parcelles to assign to the exploitation. View mode only shows details of a single parcelle, or a whole exploitation.
  const [editMode, setEditMode] = useState(false)
  const millesime = queryString?.millesime as string

  const { data, setData, post, reset, processing, transform, isDirty, setDefaults } =
    useForm<ParcelleFormData>({
      parcelles: [],
    })

  // We need to memoize the selected exploitation to avoid unnecessary re-renders
  const selectedExploitation = useMemo(
    () => filteredExploitations.find((exp) => exp.id === selectedExploitationId),
    [selectedExploitationId, filteredExploitations, millesime]
  )

  const formParcelleIds = useMemo(
    () => data.parcelles.map((parcelle) => parcelle.rpgId),
    [data.parcelles]
  )

  // Prepare data before sending the form
  transform((data) => ({
    exploitationId: selectedExploitationId || null,
    year: parseInt(millesime, 10),
    parcelles: data.parcelles,
  }))

  const sendFormAndResetState = () => {
    post(assignParcellesToExploitationUrl, {
      preserveState: true,
      onSuccess: () => {
        setEditMode(false)
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
        setData((previousData) => {
          const exists = previousData.parcelles.some((parcelle) => parcelle.rpgId === newId)
          let updatedParcelles: ParcelleFormData['parcelles']
          if (exists) {
            updatedParcelles = previousData.parcelles.filter((parcelle) => parcelle.rpgId !== newId)
          } else {
            updatedParcelles = [
              ...previousData.parcelles,
              {
                rpgId: newId,
                surface: properties['surf_parc'] || properties['SURF_PARC'],
                cultureCode: properties['code_cultu'] || properties['CODE_CULTU'],
                centroid: getCentroid(parcelleFeature.geometry),
              },
            ]
          }
          return { parcelles: updatedParcelles }
        })
      }
    },
    [editMode, selectedExploitationId, setData]
  )

  const handleMarkerClick = useCallback(
    (exploitation: ExploitationJson) => {
      if (!editMode) {
        setSelectedExploitationId(exploitation.id)
        mapRef.current?.centerOnExploitation(exploitation)
      }
    },
    [editMode]
  )

  // Fonction pour toggle une culture
  const toggleCulture = useCallback((code: string) => {
    setVisibleCultures((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    )
  }, [])

  // Fonction pour toggle toutes les cultures
  const toggleAllCultures = useCallback(() => {
    const allCodes = Object.keys(GROUPES_CULTURAUX)
    setVisibleCultures((prev) => (prev.length === allCodes.length ? [] : allCodes))
  }, [])

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

  return (
    <Layout isMapLayout={true} hideFooter={true}>
      <Head title="Visualisation" />
      <MapLayout
        pageName="Exploitations agricoles"
        leftContent={
          <VisualisationLeftSideBar
            exploitations={filteredExploitations}
            handleSearch={handleSearch}
            queryString={queryString}
            selectedExploitation={selectedExploitation}
            setSelectedExploitationId={setSelectedExploitationId}
            isMapLoading={isMapLoading}
            editMode={editMode}
            mapRef={mapRef}
            isDirty={isDirty}
            processing={processing}
            reset={reset}
            sendFormAndResetState={sendFormAndResetState}
            setData={setData}
            setDefaults={setDefaults}
            setEditMode={setEditMode}
            showBioOnly={showBioOnly}
            millesime={millesime}
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
                      data: { millesime: e.target.value },
                    })
                  },
                }}
                options={[
                  { value: '2024', label: 'RPG 2024' },
                  { value: '2023', label: 'RPG 2023' },
                ]}
              />
            </div>
          </div>
        }
        map={
          <VisualisationMap
            exploitations={filteredExploitations}
            selectedExploitation={selectedExploitation}
            isMapLoading={isMapLoading}
            setIsMapLoading={setIsMapLoading}
            onParcelleClick={handleParcelleClick}
            onMarkerClick={handleMarkerClick}
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
            ref={mapRef}
            visibleCultures={visibleCultures}
            style={style}
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
            canSwitchToBioOnly={!editMode && millesime === '2024'}
            visibleCultures={visibleCultures}
            onToggleCulture={toggleCulture}
            onToggleAllCultures={toggleAllCultures}
          />
        }
      />
    </Layout>
  )
}
