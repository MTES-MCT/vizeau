import { ChangeEvent, useCallback, useEffect, useState } from 'react'
import { Head, router, useForm } from '@inertiajs/react'
import { debounce } from 'lodash-es'
import VisualisationMap from '~/components/map/VisualisationMap'
import Layout from '~/ui/layouts/layout'
import MapLayout from '~/ui/layouts/MapLayout'
import VisualisationLeftSideBar from '~/components/visualisation-left-side-bar'
import VisualisationController from '#controllers/visualisation_controller'
import { InferPageProps } from '@adonisjs/inertia/types'
import VisualisationRightSide from '~/components/visualisation-right-side-bar'
import Button from '@codegouvfr/react-dsfr/Button'
import { createModal } from '@codegouvfr/react-dsfr/Modal'
import { ExploitationJson } from '../../types/models'

const handleSearch = debounce((e: ChangeEvent<HTMLInputElement>) => {
  router.reload({
    only: ['filteredExploitations'],
    data: { recherche: e.target.value },
    replace: true,
  })
}, 300)

const cancelEditModeModal = createModal({
  id: 'cancel-edit-mode-modal',
  isOpenedByDefault: false,
})

export type ParcelleFormData = {
  parcelles: { rpgId: string; surface: number | null; cultureCode: string | null }[]
}

export default function VisualisationPage({
  filteredExploitations,
  queryString,
  assignParcellesToExploitationUrl,
  unavailableParcellesIds,
}: InferPageProps<VisualisationController, 'index'>) {
  // Selected exploitation in the sidebar
  const [selectedExploitationId, setSelectedExploitationId] = useState<string | undefined>(
    undefined
  )
  // Edit mode allows selecting multiple parcelles to assign to the exploitation. View mode only shows details of a single parcelle, or a whole exploitation.
  const [editMode, setEditMode] = useState(false)
  // In view mode, we highlight parcelles on hover. In edit mode, the highlighted parcelles are those selected in the form.
  const [viewModeHighlightedParcelleIds, setViewModeHighlightedParcelleIds] = useState<string[]>([])
  const millesime = queryString?.millesime

  const { data, setData, post, reset, processing, transform } = useForm<ParcelleFormData>({
    parcelles: [],
  })

  const selectedExploitation = filteredExploitations.find(
    (exp) => exp.id === selectedExploitationId
  )

  /*
   * Determine which parcelles should be highlighted on the map.
   * In edit mode, highlight the parcelles selected in the form.
   * In view mode, highlight the parcelles of the selected exploitation and those hovered by the mouse.
   */
  const highlightedParcelleIds = editMode
    ? data.parcelles.map((parcelle) => parcelle.rpgId)
    : viewModeHighlightedParcelleIds.concat(
        selectedExploitation?.parcelles?.map((p) => p.rpgId) || []
      )

  // Prepare data before sending the form
  transform((data) => ({
    exploitationId: selectedExploitationId || null,
    parcelles: data.parcelles,
  }))

  const sendFormAndResetState = () => {
    post(assignParcellesToExploitationUrl, {
      preserveState: true,
      onSuccess: () => {
        setEditMode(false)
        reset()
      },
      // Reload the exploitations to get updated parcelle data
      only: ['filteredExploitations'],
    })
  }

  /*
   * Map events handlers. We need stable references for these callbacks to avoid detaching and reattaching event listeners on each render.
   */

  const handleParcelleMouseEnter = useCallback((parcelleProperties: { [name: string]: any }) => {
    const parcelleId = parcelleProperties
      ? parcelleProperties['id_parcel'] || parcelleProperties['ID_PARCEL']
      : null

    setViewModeHighlightedParcelleIds([parcelleId])
  }, [])

  const handleParcelleMouseLeave = useCallback(() => {
    setViewModeHighlightedParcelleIds([])
  }, [])

  const handleParcelleClick: (parcelleProperties: { [p: string]: any }) => void = useCallback(
    (parcelleProperties) => {
      const newId = parcelleProperties['id_parcel'] || parcelleProperties['ID_PARCEL']

      // In edit mode, we can select multiple parcelles to attach them to the exploitation
      if (editMode && selectedExploitationId) {
        setData((previousData) => {
          let updatedParcelles: ParcelleFormData['parcelles'] = previousData.parcelles.filter(
            (parcelle) => parcelle.rpgId !== newId
          )

          if (previousData.parcelles.length === updatedParcelles.length) {
            updatedParcelles = updatedParcelles.concat([
              {
                rpgId: newId,
                surface: parcelleProperties['surf_parc'] || parcelleProperties['SURF_PARC'],
                cultureCode: parcelleProperties['code_cultu'] || parcelleProperties['CODE_CULTU'],
              },
            ])
          }
          return { parcelles: updatedParcelles }
        })
      }
    },
    [editMode, selectedExploitationId, setData]
  )

  const handleMarkerMouseLeave = useCallback(() => {
    setViewModeHighlightedParcelleIds([])
  }, [])

  const handleMarkerMouseEnter = useCallback(
    (exploitation: ExploitationJson) => {
      if (!editMode && exploitation.parcelles) {
        setViewModeHighlightedParcelleIds(exploitation.parcelles.map((p) => p.rpgId))
      }
    },
    [editMode]
  )

  const handleMarkerClick = useCallback(
    (exploitation: ExploitationJson) => {
      if (!editMode) {
        setSelectedExploitationId(exploitation.id)
      }
    },
    [editMode]
  )

  // When entering edit mode, we need to refresh the unavailable parcelles from the server.
  useEffect(() => {
    if (!editMode || !selectedExploitationId) return

    router.reload({
      only: ['unavailableParcellesIds'],
      data: {
        exploitationId: selectedExploitationId,
        millesime,
      },
      replace: true,
    })
  }, [editMode, selectedExploitationId])

  return (
    <Layout isMapLayout={true} hideFooter={true}>
      <Head title="Visualisation" />
      <MapLayout
        pageName="Exploitations"
        leftContent={
          <VisualisationLeftSideBar
            exploitations={filteredExploitations}
            handleSearch={handleSearch}
            queryString={queryString}
            selectedExploitation={selectedExploitation}
            setSelectedExploitationId={setSelectedExploitationId}
          />
        }
        headerAdditionalContent={
          <div className="flex flex-1 items-center justify-end gap-4">
            {selectedExploitationId &&
              millesime === '2024' &&
              (editMode ? (
                <>
                  <Button
                    priority="secondary"
                    onClick={() => {
                      if (data.parcelles.length > 0) {
                        cancelEditModeModal.open()
                        return
                      } else {
                        reset()
                        setEditMode(false)
                      }
                    }}
                  >
                    Retour
                  </Button>
                  <Button
                    disabled={processing}
                    onClick={() => {
                      sendFormAndResetState()
                    }}
                  >
                    Appliquer
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => {
                    setData('parcelles', selectedExploitation?.parcelles || [])
                    setEditMode(true)
                  }}
                >
                  Gérer les parcelles
                </Button>
              ))}
            <cancelEditModeModal.Component
              title="Modifications non enregistrées"
              iconId="fr-icon-arrow-right-line"
              buttons={[
                {
                  children: 'Annuler',
                  doClosesModal: true,
                  onClick: () => {
                    reset()
                    setEditMode(false)
                  },
                },
                {
                  children: 'Appliquer les modifications',
                  disabled: processing,
                  onClick: () => {
                    sendFormAndResetState()
                  },
                },
              ]}
            >
              Vous avez apporté des modifications à votre sélection.
              <br />
              Souhaitez-vous appliquer ces modifications ou les annuler ?
            </cancelEditModeModal.Component>
          </div>
        }
        map={
          <VisualisationMap
            exploitations={filteredExploitations}
            selectedExploitation={selectedExploitation}
            onParcelleMouseEnter={handleParcelleMouseEnter}
            onParcelleMouseLeave={handleParcelleMouseLeave}
            onParcelleClick={handleParcelleClick}
            onMarkerMouseEnter={handleMarkerMouseEnter}
            onMarkerMouseLeave={handleMarkerMouseLeave}
            onMarkerClick={handleMarkerClick}
            highlightedParcelleIds={highlightedParcelleIds}
            unavailableParcelleIds={unavailableParcellesIds}
            millesime={millesime}
          />
        }
        rightContent={<VisualisationRightSide />}
      />
    </Layout>
  )
}
