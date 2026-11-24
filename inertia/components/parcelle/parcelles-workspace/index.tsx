import { useEffect, useMemo, useRef, useState } from 'react'

import type {
  AacEmprise,
  ParcelleOwner,
  ParcellesSelectionMapHandle,
  SelectedParcelle,
} from '~/components/map/parcelles-selection-map'
import type { BaseMapId } from '~/components/map/styles/base_maps'
import { EXPLOITATION_FILL_COLORS } from '~/components/map/styles/parcelles-agricoles'
import AddInstructions, {
  getMethods,
  MethodValue,
} from '~/components/parcelle/parcelles-workspace/add-instructions'
import ColorModePanel from '~/components/parcelle/parcelles-workspace/color-mode-panel'
import ExploitationsMethod from '~/components/parcelle/parcelles-workspace/exploitations-method'
import ParcelleFiche from '~/components/parcelle/parcelles-workspace/parcelle-fiche'
import { usePacageSearchAvailable } from '~/components/parcelle/parcelles-workspace/pacage_search'
import PacageMethod from '~/components/parcelle/parcelles-workspace/pacage-method'
import PanelTabs, { PanelTab } from '~/components/parcelle/parcelles-workspace/panel-tabs'
import type { ParcellesSelection } from '~/components/parcelle/parcelles-workspace/selection'
import { useRemoveExploitationConfirm } from '~/components/parcelle/parcelles-workspace/remove-exploitation-modal'
import SelectionPanel, {
  type GroupBy,
} from '~/components/parcelle/parcelles-workspace/selection-panel'
import {
  useDefaultLayers,
  WorkspaceLayers,
} from '~/components/parcelle/parcelles-workspace/use_default_layers'
import {
  useExploitationsDraft,
  type WorkspaceExploitations,
} from '~/components/parcelle/parcelles-workspace/use_exploitations_draft'
import { usePacagesDraft } from '~/components/parcelle/parcelles-workspace/use_pacages_draft'
import {
  type ColorMode,
  useZoneExploitations,
} from '~/components/parcelle/parcelles-workspace/use_zone_exploitations'
import { useParcelleFiche } from '~/components/parcelle/parcelles-workspace/use_parcelle_fiche'
import { useParcellesDraft } from '~/components/parcelle/parcelles-workspace/use_parcelles_draft'
import WorkspaceFooter, {
  discardModal,
} from '~/components/parcelle/parcelles-workspace/workspace-footer'
import WorkspaceMap from '~/components/parcelle/parcelles-workspace/workspace-map'
import { showFlashToasts } from '~/functions/flash_messages'
import type { MapFocusContext } from '~/functions/map_focus'
import WorkspaceLayout from '~/ui/layouts/WorkspaceLayout'
import MethodTabs from '~/ui/MethodTabs'

export type { ParcellesSelection, WorkspaceExploitations }

const METHOD_GROUP_BY: Partial<Record<MethodValue, GroupBy>> = {
  carte: 'toutes',
  exploitations: 'exploitations',
  pacage: 'pacage',
}

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
  /** Contexte de l'écran appelant : choisit la vue à l'ouverture et les AAC mises en valeur. */
  mapFocus?: MapFocusContext
  pmtilesUrl: string
  /** Couches fournies par l'écran appelant pour partager ses réglages, à défaut propres à l'éditeur. */
  layers?: WorkspaceLayers
  baseMap?: BaseMapId
  onBaseMapChange?: (baseMap: BaseMapId) => void
  unavailableRpgIds?: Record<string, string[]>
  onMillesimeChange?: (millesime: string) => void
  isMillesimeLoading?: boolean
  /**
   * Exploitation dont on édite les parcelles : quand la carte est colorée par exploitation, la
   * sélection porte son nom et ses parcelles enregistrées ne comptent pas parmi les autres.
   */
  currentExploitation?: { id?: string; name: string }
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
  const [groupBy, setGroupBy] = useState<GroupBy>('toutes')
  const draft = useParcellesDraft(initialSelection, millesime, props.savedSelection)
  const exploitations = useExploitationsDraft(props.exploitations, millesime, draft)
  const isPacageSearchAvailable = usePacageSearchAvailable()
  const pacages = usePacagesDraft(millesime, draft, unavailableRpgIds?.[millesime])
  const fiche = useParcelleFiche(millesime, isPacageSearchAvailable)
  const [colorMode, setColorMode] = useState<ColorMode>('culture')
  const zoneExploitations = useZoneExploitations(millesime, colorMode === 'exploitation')
  const currentExploitationId = props.currentExploitation?.id
  // Parcelle survolée dans la liste du PACAGE : elle prend sur la carte la place de la parcelle
  // ouverte, qui rejoint les autres parcelles du PACAGE le temps du survol
  const [hoveredParcelleId, setHoveredParcelleId] = useState<string | null>(null)
  useEffect(() => setHoveredParcelleId(null), [fiche.parcelle])
  const selectedIds = useMemo(() => new Set(draft.selectedParcelleIds), [draft.selectedParcelleIds])
  const unavailableIds = useMemo(
    () => new Set(unavailableRpgIds?.[millesime] ?? []),
    [unavailableRpgIds, millesime]
  )
  // Parcelles des autres exploitations de la zone, avec leur exploitation, montrée au survol
  const otherOwners = useMemo(() => {
    const owners = new Map<string, ParcelleOwner>()
    for (const { id, name, rpgIds } of zoneExploitations.exploitations) {
      if (id === currentExploitationId) continue
      const owner = { name, rpgIds }
      for (const rpgId of rpgIds) owners.set(rpgId, owner)
    }
    return owners
  }, [zoneExploitations.exploitations, currentExploitationId])
  // Couleur des parcelles par exploitation : une parcelle sélectionnée compte pour l'exploitation
  // éditée, même avant d'être enregistrée
  const parcelleColors = useMemo(() => {
    if (colorMode !== 'exploitation') return null
    const colors: Record<string, string> = {}
    for (const rpgId of [...otherOwners.keys(), ...unavailableIds]) {
      colors[rpgId] = EXPLOITATION_FILL_COLORS.other
    }
    for (const rpgId of draft.selectedParcelleIds) colors[rpgId] = EXPLOITATION_FILL_COLORS.current
    return colors
  }, [colorMode, otherOwners, unavailableIds, draft.selectedParcelleIds])
  const colorCounts = {
    current: draft.selectedParcelleIds.length,
    other: Object.values(parcelleColors ?? {}).filter(
      (color) => color === EXPLOITATION_FILL_COLORS.other
    ).length,
  }
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
    pacages.reset()
    fiche.reset()
    zoneExploitations.reset()
    setMillesime(defaultMillesime)
  }, [isOpen])

  const handleMillesimeChange = (newMillesime: string) => {
    setMillesime(newMillesime)
    props.onMillesimeChange?.(newMillesime)
  }

  // Le panneau de droite montre la sélection rangée selon la méthode d'ajout choisie
  const handleMethodChange = (newMethod: MethodValue) => {
    setMethod(newMethod)
    fiche.close()
    const methodGroupBy = METHOD_GROUP_BY[newMethod]
    if (methodGroupBy) {
      setPanelTab('selection')
      setGroupBy(methodGroupBy)
    }
  }

  // Une parcelle d'une liste : la carte se centre dessus et sa fiche s'ouvre
  const showParcelle = (parcelle: SelectedParcelle) => {
    if (parcelle.centroid) mapRef.current?.flyTo(parcelle.centroid)
    fiche.open(parcelle)
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
            methods={getMethods(exploitations.isEnabled, isPacageSearchAvailable)}
            value={method}
            onChange={handleMethodChange}
            legend="Méthode d'ajout"
          />
        ),
        subtitle: variant === 'inline' ? title : undefined,
        tabLabel: 'Ajouter',
        content: (
          <div className="flex flex-col gap-3">
            {fiche.parcelle ? (
              <ParcelleFiche
                millesime={millesime}
                parcelle={fiche.parcelle}
                pacage={fiche.pacage}
                selectedIds={selectedIds}
                unavailableIds={unavailableIds}
                onToggle={draft.toggleParcelle}
                onAddPacage={pacages.addPacage}
                onRetry={fiche.retry}
                onClose={fiche.close}
                onParcelleClick={showParcelle}
                onParcelleHover={(parcelle) => setHoveredParcelleId(parcelle?.rpgId ?? null)}
              />
            ) : method === 'pacage' ? (
              <PacageMethod pacages={pacages} />
            ) : method === 'exploitations' ? (
              <ExploitationsMethod
                millesime={millesime}
                exploitations={exploitations}
                onRemoveRequest={removeExploitation.request}
                pickerContainerRef={pickerContainerRef}
              />
            ) : (
              <AddInstructions
                hasUnavailable={Boolean(unavailableRpgIds)}
                isPacageSearchAvailable={isPacageSearchAvailable}
              />
            )}
          </div>
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
            onParcelleOpen={fiche.open}
            focusedParcelleId={hoveredParcelleId ?? fiche.parcelle?.rpgId}
            relatedParcelleIds={fiche.pacageParcelleIds}
            parcelleColors={parcelleColors}
            parcelleOwners={colorMode === 'exploitation' ? otherOwners : null}
            aacs={props.aacs}
            focus={props.mapFocus ?? {}}
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
            <div className="flex flex-col gap-4">
              <ColorModePanel
                mode={colorMode}
                onModeChange={setColorMode}
                currentName={props.currentExploitation?.name}
                counts={colorCounts}
                namesStatus={zoneExploitations.status}
                onNamesRetry={zoneExploitations.retry}
              />
              {layers.panel}
            </div>
          ) : (
            <SelectionPanel
              title={selectionTitle}
              millesime={millesime}
              parcelles={draft.selectedParcelles}
              addedParcelleIds={draft.addedParcelleIds}
              removedParcelles={draft.removedParcelles}
              onParcelleRestore={draft.toggleParcelle}
              onParcelleClick={showParcelle}
              exploitations={exploitations.isEnabled ? exploitations : undefined}
              pacages={isPacageSearchAvailable ? pacages : undefined}
              groupBy={groupBy}
              onGroupByChange={setGroupBy}
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
