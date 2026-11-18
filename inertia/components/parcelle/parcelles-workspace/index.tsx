import { useEffect, useRef, useState } from 'react'

import type {
  AacEmprise,
  Bbox,
  ParcellesSelectionMapHandle,
} from '~/components/map/parcelles-selection-map'
import type { BaseMapId } from '~/components/map/styles/base_maps'
import AddInstructions, {
  getMethods,
  MethodValue,
} from '~/components/parcelle/parcelles-workspace/add-instructions'
import ExploitationsMethod from '~/components/parcelle/parcelles-workspace/exploitations-method'
import PanelTabs, { PanelTab } from '~/components/parcelle/parcelles-workspace/panel-tabs'
import type { ParcellesSelection } from '~/components/parcelle/parcelles-workspace/selection'
import { useRemoveExploitationConfirm } from '~/components/parcelle/parcelles-workspace/remove-exploitation-modal'
import SelectionPanel from '~/components/parcelle/parcelles-workspace/selection-panel'
import {
  useDefaultLayers,
  WorkspaceLayers,
} from '~/components/parcelle/parcelles-workspace/use_default_layers'
import {
  useExploitationsDraft,
  type WorkspaceExploitations,
} from '~/components/parcelle/parcelles-workspace/use_exploitations_draft'
import { useParcellesDraft } from '~/components/parcelle/parcelles-workspace/use_parcelles_draft'
import WorkspaceFooter, {
  discardModal,
} from '~/components/parcelle/parcelles-workspace/workspace-footer'
import WorkspaceMap from '~/components/parcelle/parcelles-workspace/workspace-map'
import { showFlashToasts } from '~/functions/flash_messages'
import WorkspaceLayout from '~/ui/layouts/WorkspaceLayout'
import MethodTabs from '~/ui/MethodTabs'

export type { ParcellesSelection, WorkspaceExploitations }

export type ParcellesWorkspaceProps = {
  variant: 'overlay' | 'inline'
  isOpen: boolean
  title: string
  /** Titre de la liste des parcelles sélectionnées, par exemple « Parcelles du projet ». */
  selectionTitle: string
  initialSelection: ParcellesSelection
  /**
   * Sélection enregistrée, référence des parcelles nouvelles et retirées quand elle diffère de
   * la sélection à l'ouverture (formulaire pas encore enregistré). À défaut, `initialSelection`.
   */
  savedSelection?: ParcellesSelection
  defaultMillesime: string
  aacs: AacEmprise[]
  initialBbox?: Bbox
  pmtilesUrl: string
  /** Couches fournies par l'écran appelant pour partager ses réglages, à défaut propres à l'éditeur. */
  layers?: WorkspaceLayers
  baseMap?: BaseMapId
  onBaseMapChange?: (baseMap: BaseMapId) => void
  unavailableRpgIds?: Record<string, string[]>
  onMillesimeChange?: (millesime: string) => void
  isMillesimeLoading?: boolean
  /** Exploitations dont on peut ajouter les parcelles d'un bloc, avec la méthode « Exploitations ». */
  exploitations?: WorkspaceExploitations
  submitLabel: string
  isSubmitting?: boolean
  /**
   * Ferme l'éditeur et confirme la mise à jour dès la validation. Par défaut en overlay, où la
   * sélection est simplement rendue à l'écran appelant. À désactiver quand celui-ci enregistre
   * côté serveur : il ferme alors l'éditeur une fois l'enregistrement terminé.
   */
  closeOnSubmit?: boolean
  /**
   * Reçoit toute la sélection, la liste des millésimes modifiés et, si des exploitations sont
   * fournies, les exploitations ajoutées par millésime.
   */
  onSubmit: (
    selection: ParcellesSelection,
    changedMillesimes: string[],
    addedExploitationIds: Record<string, string[]>
  ) => void
  onClose: () => void
}

export default function ParcellesWorkspace(props: ParcellesWorkspaceProps) {
  const { variant, isOpen, title, initialSelection, defaultMillesime } = props
  const { unavailableRpgIds, submitLabel, selectionTitle, onClose } = props
  const mapRef = useRef<ParcellesSelectionMapHandle>(null)
  const [millesime, setMillesime] = useState(defaultMillesime)
  const [method, setMethod] = useState<MethodValue>('carte')
  const [panelTab, setPanelTab] = useState<PanelTab>('selection')
  const draft = useParcellesDraft(initialSelection, millesime, props.savedSelection)
  const exploitations = useExploitationsDraft(props.exploitations, millesime, draft)
  const pickerContainerRef = useRef<HTMLDivElement>(null)
  const removeExploitation = useRemoveExploitationConfirm({
    getSelectedCount: exploitations.getSelectedCount,
    onRemove: exploitations.remove,
    // Le champ d'ajout reprend le focus, le bouton de retrait ayant disparu
    onRemoved: () =>
      pickerContainerRef.current?.querySelector<HTMLInputElement>('[role="combobox"]')?.focus(),
  })
  const defaultLayers = useDefaultLayers()
  const layers = props.layers ?? defaultLayers

  // Réinitialisée à l'ouverture seulement, pas à chaque rendu du parent
  useEffect(() => {
    if (!isOpen) return
    draft.resetDraft()
    exploitations.reset()
    setMillesime(defaultMillesime)
  }, [isOpen])

  const handleMillesimeChange = (newMillesime: string) => {
    setMillesime(newMillesime)
    props.onMillesimeChange?.(newMillesime)
  }

  const requestClose = () => {
    if (draft.changes.length > 0) {
      discardModal.open()
    } else {
      onClose()
    }
  }

  const handleSubmit = () => {
    props.onSubmit(
      draft.selection,
      draft.changes.map((change) => change.millesime),
      exploitations.addedIds
    )
    if (props.closeOnSubmit ?? variant === 'overlay') {
      showFlashToasts({ success: { message: 'Les parcelles ont été mises à jour.' } })
      onClose()
    }
  }

  return (
    <WorkspaceLayout
      variant={variant}
      isOpen={isOpen}
      title={title}
      subtitle={`Les changements sont appliqués avec « ${submitLabel} ».`}
      onClose={requestClose}
      left={{
        title: 'Ajouter des parcelles',
        toolbar: (
          <MethodTabs
            methods={getMethods(exploitations.isEnabled)}
            value={method}
            onChange={setMethod}
            legend="Méthode d'ajout"
          />
        ),
        subtitle: variant === 'inline' ? title : undefined,
        tabLabel: 'Ajouter',
        content:
          method === 'exploitations' ? (
            <ExploitationsMethod
              millesime={millesime}
              exploitations={exploitations}
              onRemoveRequest={removeExploitation.request}
              pickerContainerRef={pickerContainerRef}
            />
          ) : (
            <AddInstructions hasUnavailable={Boolean(unavailableRpgIds)} />
          ),
      }}
      center={{
        tabLabel: 'Carte',
        content: (
          <WorkspaceMap
            mapRef={mapRef}
            pmtilesUrl={props.pmtilesUrl}
            millesime={millesime}
            isMillesimeLoading={props.isMillesimeLoading ?? false}
            onMillesimeChange={handleMillesimeChange}
            selectedParcelleIds={draft.selectedParcelleIds}
            unavailableParcelleIds={unavailableRpgIds?.[millesime]}
            onParcelleToggle={draft.toggleParcelle}
            aacs={props.aacs}
            initialBbox={props.initialBbox}
            layers={layers.map}
            baseMap={props.baseMap}
            onBaseMapChange={props.onBaseMapChange}
          />
        ),
      }}
      right={{
        title: panelTab === 'couches' ? 'Couches' : 'Sélection',
        tabLabel: 'Sélection et couches',
        badge: draft.selectedParcelles.length,
        headerContent: (
          <PanelTabs
            tab={panelTab}
            onTabChange={setPanelTab}
            selectionCount={draft.selectedParcelles.length}
          />
        ),
        content:
          panelTab === 'couches' ? (
            layers.panel
          ) : (
            <SelectionPanel
              title={selectionTitle}
              millesime={millesime}
              parcelles={draft.selectedParcelles}
              addedParcelleIds={draft.addedParcelleIds}
              removedParcelles={draft.removedParcelles}
              onParcelleRestore={draft.toggleParcelle}
              onParcelleClick={(parcelle) => mapRef.current?.flyTo(parcelle.centroid!)}
            />
          ),
      }}
      footer={
        <>
          <WorkspaceFooter
            millesime={millesime}
            parcelles={draft.selectedParcelles}
            changes={draft.changes}
            submitLabel={submitLabel}
            isSubmitting={props.isSubmitting ?? false}
            onCancel={requestClose}
            onSubmit={handleSubmit}
            onDiscard={onClose}
          />
          {removeExploitation.modal}
        </>
      }
    />
  )
}
