import Button from '@codegouvfr/react-dsfr/Button'
import { createModal } from '@codegouvfr/react-dsfr/Modal'
import { fr } from '@codegouvfr/react-dsfr'
import Loader from '~/ui/Loader'
import { ExploitationJson } from '../../types/models'

export type ParcellesManagerProps = {
  editMode: boolean
  selectedExploitation?: ExploitationJson | undefined
  setData: (...args: unknown[]) => void
  setDefaults: (...args: unknown[]) => void
  setEditMode: (...args: unknown[]) => void
  showBioOnly: boolean
  millesime: string
  isDirty: boolean
  processing: boolean
  reset: (...args: unknown[]) => void
  sendFormAndResetState: (...args: unknown[]) => void
}

export default function ParcellesManager({
  editMode,
  setData,
  selectedExploitation,
  setDefaults,
  setEditMode,
  showBioOnly,
  millesime,
  isDirty,
  processing,
  reset,
  sendFormAndResetState,
}: ParcellesManagerProps) {
  const cancelEditModeModal = createModal({
    id: 'cancel-edit-mode-modal',
    isOpenedByDefault: false,
  })
  return (
    <div
      className="flex flex-col gap-1"
      style={{
        backgroundColor: fr.colors.decisions.background.default.grey.default,
        border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
      }}
    >
      {editMode ? (
        <div className="fr-p-2v flex flex-col gap-4 editing-glow">
          <h6 className="fr-text--md bold fr-mb-0 flex items-center">
            Gestion des parcelles en cours
            <span className="w-fit">
              <Loader type="dots" size="sm" />
            </span>
          </h6>
          <div className="flex gap-2">
            <Button
              priority="secondary"
              size="small"
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
              size="small"
              disabled={processing}
              onClick={() => {
                sendFormAndResetState()
              }}
            >
              Appliquer
            </Button>
          </div>
        </div>
      ) : (
        <Button
          disabled={showBioOnly}
          size="small"
          iconId="fr-icon-collage-line"
          onClick={() => {
            setData(
              'parcelles',
              selectedExploitation?.parcelles?.filter(
                (p: { year: number }) => p.year.toString() === millesime
              ) || []
            )
            // We set the new data as default so the form is not dirty at the beginning of edit mode
            setDefaults()
            setEditMode(true)
          }}
          className="flex justify-center"
          style={{ whiteSpace: 'nowrap', width: '100%' }}
        >
          Attribuer les parcelles
        </Button>
      )}

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
  )
}
