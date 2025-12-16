import { ChangeEvent, useState } from 'react'
import { Head, router, useForm } from '@inertiajs/react'
import { debounce } from 'lodash-es'
import VisualisationMap from '~/components/map/VisualisationMap'
import Layout from '~/ui/layouts/layout'
import MapLayout from '~/ui/layouts/MapLayout'
import VisualisationLeftSideBar from '~/components/visualisation-left-side-bar'
import VisualisationController from '#controllers/visualisation_controller'
import { InferPageProps } from '@adonisjs/inertia/types'
import { ExploitationJson } from '../../types/models'
import VisualisationRightSide from '~/components/visualisation-right-side-bar'
import Button from '@codegouvfr/react-dsfr/Button'
import { createModal } from '@codegouvfr/react-dsfr/Modal'

const handleSearch = debounce((e: ChangeEvent<HTMLInputElement>) => {
  router.reload({
    only: ['exploitations'],
    data: { recherche: e.target.value },
    replace: true,
  })
}, 300)

const cancelEditModeModal = createModal({
  id: 'cancel-edit-mode-modal',
  isOpenedByDefault: false,
})

/*
 TODO:
  - Hoist la gestion des popups de carte pour pouvoir les reset en même temps que le form. En profiter pour externaliser les popups.
  - Envoyer les modifications au backend
  - Initialiser le formulaire avec les parcelles déjà associées à l'exploitation sélectionnée
    - Uniquement pouvoir sélectionner des parcelles libres.
    - Uniquement pouvoir déselectionner des parcelles associées à l'exploitation sélectionnée
  - Gérer les parcours des modales (annuler les modifications / appliquer les modifications, les resets de formulaire, etc.)
 */

export default function VisualisationPage({
  exploitations,
  queryString,
}: InferPageProps<VisualisationController, 'index'>) {
  const filteredExploitation = exploitations
  const [selectedExploitation, setSelectedExploitation] = useState<ExploitationJson | undefined>(
    undefined
  )
  const [parcelleEditMode, setParcelleEditMode] = useState(false)

  const { data, setData, reset } = useForm({
    selectedParcelleIds: [] as string[],
  })

  const handleParcelleChange: (parcelleProperties: { [p: string]: any }) => void = (
    parcelleProperties
  ) => {
    console.log('Parcelle clicked:', parcelleProperties)
    const newId = parcelleProperties['id_parcel'] || parcelleProperties['ID_PARCEL']

    // In edit mode, we can select multiple parcelles to attach them to the exploitation
    if (parcelleEditMode && selectedExploitation) {
      setData((previousData) => {
        let updatedParcelles

        if (previousData.selectedParcelleIds.includes(newId)) {
          updatedParcelles = previousData.selectedParcelleIds.filter((id) => id !== newId)
        } else {
          updatedParcelles = [...previousData.selectedParcelleIds, newId]
        }
        return { selectedParcelleIds: updatedParcelles }
      })
    }
    // In view mode, we just show a single parcelle details
    else {
      setData('selectedParcelleIds', [newId])
    }
  }

  return (
    <Layout isMapLayout={true} hideFooter={true}>
      <Head title="Visualisation" />
      <MapLayout
        pageName="Exploitations"
        leftContent={
          <VisualisationLeftSideBar
            exploitations={filteredExploitation}
            handleSearch={handleSearch}
            queryString={queryString}
            selectedExploitation={selectedExploitation}
            setSelectedExploitation={setSelectedExploitation}
          />
        }
        headerAdditionalContent={
          <div className="flex flex-1 items-center justify-end gap-4">
            {selectedExploitation &&
              (parcelleEditMode ? (
                <>
                  <Button
                    priority="secondary"
                    onClick={() => {
                      if (data.selectedParcelleIds.length > 0) {
                        cancelEditModeModal.open()
                        return
                      } else {
                        setParcelleEditMode(false)
                        reset()
                      }
                    }}
                  >
                    Retour
                  </Button>
                  <Button
                    onClick={() => {
                      // Envoyer les modifications des parcelles
                      setParcelleEditMode(false)
                      reset()
                    }}
                  >
                    Appliquer
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => {
                    reset()
                    setParcelleEditMode(true)
                  }}
                >
                  Gérer les parcelles
                </Button>
              ))}
            <cancelEditModeModal.Component
              title="Modification non enregistrées"
              iconId="fr-icon-arrow-right-line"
              buttons={[
                {
                  children: 'Annuler',
                  doClosesModal: true,
                  onClick: () => {
                    reset()
                  },
                },
                {
                  children: 'Appliquer les modifications',
                  onClick: () => {
                    // Send form

                    setParcelleEditMode(false)
                    reset()
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
            exploitations={filteredExploitation}
            exploitation={selectedExploitation}
            setExploitation={setSelectedExploitation}
            onParcelleClick={handleParcelleChange}
            selectedParcelleIds={data.selectedParcelleIds}
            resetSelectedParcelleIds={() => reset('selectedParcelleIds')}
          />
        }
        rightContent={<VisualisationRightSide />}
      />
    </Layout>
  )
}
