import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react'
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
  const millesime = queryString?.millesime

  const { data, setData, post, reset, processing, transform, isDirty, setDefaults } =
    useForm<ParcelleFormData>({
      parcelles: [],
    })

  // We need to memoize the selected exploitation to avoid unnecessary re-renders
  const selectedExploitation = useMemo(
    () => filteredExploitations.find((exp) => exp.id === selectedExploitationId),
    [selectedExploitationId, filteredExploitations]
  )

  const formParcelleIds = useMemo(
    () => data.parcelles.map((parcelle) => parcelle.rpgId),
    [data.parcelles]
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
      },
      // Reload the exploitations to get updated parcelle data
      only: ['filteredExploitations'],
    })
  }

  /*
   * Map events handlers. We need stable references for these callbacks to avoid detaching and reattaching event listeners on each render.
   */
  const handleParcelleClick: (parcelleProperties: { [p: string]: any }) => void = useCallback(
    (parcelleProperties) => {
      const newId = parcelleProperties['id_parcel'] || parcelleProperties['ID_PARCEL']

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
                surface: parcelleProperties['surf_parc'] || parcelleProperties['SURF_PARC'],
                cultureCode: parcelleProperties['code_cultu'] || parcelleProperties['CODE_CULTU'],
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
      }
    },
    [editMode]
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
                      // Only display a confirmation modal if there are unsaved changes
                      if (isDirty) {
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
                    setData(
                      'parcelles',
                      selectedExploitation?.parcelles?.filter(
                        (p) => p.year.toString() === millesime
                      ) || []
                    )
                    // We set the new data as default so the form is not dirty at the beginning of edit mode
                    setDefaults()
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
            onParcelleClick={handleParcelleClick}
            onMarkerClick={handleMarkerClick}
            formParcelleIds={formParcelleIds}
            unavailableParcelleIds={unavailableParcellesIds}
            millesime={millesime}
            editMode={editMode}
          />
        }
        rightContent={<VisualisationRightSide />}
      />
    </Layout>
  )
}
