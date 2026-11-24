import { fr } from '@codegouvfr/react-dsfr'
import Button from '@codegouvfr/react-dsfr/Button'
import ToggleSwitch from '@codegouvfr/react-dsfr/ToggleSwitch'
import { useId } from 'react'

import type { SelectedParcelle } from '~/components/map/parcelles-selection-map'
import { toSelectedParcelle } from '~/components/parcelle/parcelles-workspace/pacage_search'
import ParcelleItem from '~/components/parcelle/parcelles-workspace/parcelle-item'
import { formatSurface, plural } from '~/components/parcelle/parcelles-workspace/selection'
import type { FichePacage } from '~/components/parcelle/parcelles-workspace/use_parcelle_fiche'
import { getCultureByCode } from '~/functions/cultures_group'
import Loader from '~/ui/Loader'
import type { RpgPacageFound, RpgParcelle } from '#types/rpg'

type ParcelleFicheProps = {
  millesime: string
  parcelle: SelectedParcelle
  /** `null` quand le serveur ne lit pas les Parquet du RPG : la fiche n'a pas de PACAGE. */
  pacage: FichePacage | null
  selectedIds: Set<string>
  /** Parcelles rattachées à une autre exploitation pour ce millésime. */
  unavailableIds: Set<string>
  onToggle: (parcelle: SelectedParcelle) => void
  onAddPacage: (result: RpgPacageFound) => void
  onRetry: () => void
  onClose: () => void
  /** Ouvre une autre parcelle du PACAGE et centre la carte dessus. */
  onParcelleClick: (parcelle: SelectedParcelle) => void
  /** Parcelle du PACAGE survolée dans la liste, `null` quand le pointeur la quitte. */
  onParcelleHover: (parcelle: SelectedParcelle | null) => void
}

const mentionColor = fr.colors.decisions.text.mention.grey.default
const borderColor = fr.colors.decisions.border.default.grey.default

/*
 * Fiche de la parcelle cliquée sur la carte, dans le panneau d'ajout : son état dans la sélection,
 * puis son PACAGE et les autres parcelles déclarées avec elle dans la zone de l'utilisateur.
 */
export default function ParcelleFiche(props: ParcelleFicheProps) {
  const { millesime, parcelle, pacage, selectedIds, unavailableIds, onToggle, onClose } = props
  const titleId = useId()
  const culture = getCultureByCode(parcelle.cultureCode)
  const isSelected = selectedIds.has(parcelle.rpgId)
  const isUnavailable = unavailableIds.has(parcelle.rpgId)
  const owner =
    pacage?.status === 'found'
      ? pacage.parcelles.find((p) => p.rpgId === parcelle.rpgId)?.exploitation?.name
      : undefined
  const metas = [
    parcelle.surface === null ? 'Surface non renseignée' : `${parcelle.surface} ha`,
    `RPG ${parcelle.rpgId}`,
    `millésime ${millesime}`,
  ]

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-3">
      <div className="flex items-start gap-2">
        <span
          className="inline-block w-3 h-3 rounded-full shrink-0 fr-mt-1v"
          style={{ backgroundColor: culture.color }}
          aria-hidden="true"
        />
        <div className="flex flex-col flex-1 min-w-0">
          <h3 id={titleId} className="fr-text--md fr-text--bold fr-mb-0">
            {culture.label}
          </h3>
          <p className="fr-text--xs fr-mb-0" style={{ color: mentionColor }}>
            {metas.join(' · ')}
          </p>
        </div>
        <Button
          priority="tertiary no outline"
          size="small"
          iconId="fr-icon-close-line"
          title="Fermer la fiche"
          onClick={onClose}
        />
      </div>

      {isUnavailable ? (
        <p className="fr-text--sm fr-mb-0">
          Rattachée à {owner ?? 'une autre exploitation'} pour ce millésime : elle ne peut pas être
          ajoutée.
        </p>
      ) : (
        <ToggleSwitch
          label="Dans la sélection"
          checked={isSelected}
          onChange={() => onToggle(parcelle)}
          showCheckedHint={false}
          classes={{ root: 'fr-py-0' }}
        />
      )}

      {pacage && <PacageSection {...props} pacage={pacage} />}
    </section>
  )
}

function PacageSection({
  millesime,
  parcelle,
  pacage,
  selectedIds,
  unavailableIds,
  onToggle,
  onAddPacage,
  onRetry,
  onParcelleClick,
  onParcelleHover,
}: ParcelleFicheProps & { pacage: FichePacage }) {
  const found = pacage.status === 'found' ? pacage : null

  return (
    <div
      className="flex flex-col gap-2 fr-pt-2w"
      style={{ borderTop: `1px solid ${borderColor}` }}
      aria-live="polite"
    >
      <h4 className="fr-text--sm fr-text--bold fr-mb-0">
        {found ? `PACAGE ${found.pacage}` : 'PACAGE'}
      </h4>
      {pacage.status === 'loading' && (
        <div className="flex items-center gap-2">
          {/* Le Loader se centre dans son conteneur : il garde ici sa propre largeur */}
          <div className="shrink-0" style={{ width: '1.5rem' }}>
            <Loader size="sm" />
          </div>
          <span className="fr-text--sm">Recherche du PACAGE…</span>
        </div>
      )}
      {pacage.status === 'error' && (
        <>
          <p className="fr-text--sm fr-mb-0">La recherche du PACAGE a échoué.</p>
          <Button
            size="small"
            priority="secondary"
            iconId="fr-icon-refresh-line"
            iconPosition="left"
            onClick={onRetry}
          >
            Réessayer
          </Button>
        </>
      )}
      {pacage.status === 'outsideZone' && (
        <p className="fr-text--sm fr-mb-0">
          Cette parcelle est hors de votre zone, vos AAC et 10 km autour : son PACAGE n’est pas
          consultable.
        </p>
      )}
      {pacage.status === 'notFound' && (
        <p className="fr-text--sm fr-mb-0">
          Aucun PACAGE trouvé pour cette parcelle dans le RPG {millesime}.
        </p>
      )}
      {found && (
        <PacageParcelles
          result={found}
          parcelle={parcelle}
          selectedIds={selectedIds}
          unavailableIds={unavailableIds}
          onToggle={onToggle}
          onAddPacage={onAddPacage}
          onParcelleClick={onParcelleClick}
          onParcelleHover={onParcelleHover}
        />
      )}
    </div>
  )
}

function PacageParcelles({
  result,
  parcelle,
  selectedIds,
  unavailableIds,
  onToggle,
  onAddPacage,
  onParcelleClick,
  onParcelleHover,
}: Pick<
  ParcelleFicheProps,
  | 'parcelle'
  | 'selectedIds'
  | 'unavailableIds'
  | 'onToggle'
  | 'onAddPacage'
  | 'onParcelleClick'
  | 'onParcelleHover'
> & { result: RpgPacageFound }) {
  const { parcelles } = result
  const exploitant = result.exploitation?.name
  const selected = parcelles.filter((p) => selectedIds.has(p.rpgId))
  const missing = parcelles.filter((p) => !selectedIds.has(p.rpgId) && !unavailableIds.has(p.rpgId))
  const elsewhere = parcelles.length - selected.length - missing.length

  // L'interrupteur montre si la parcelle est sélectionnée : la mention ne dit que le reste
  const statusOf = (p: RpgParcelle) =>
    [
      p.rpgId === parcelle.rpgId && 'cette parcelle',
      unavailableIds.has(p.rpgId) &&
        `rattachée à ${p.exploitation?.name ?? 'une autre exploitation'}`,
    ]
      .filter(Boolean)
      .join(', ') || undefined

  return (
    <>
      {exploitant && (
        <p className="fr-text--sm fr-mb-0">
          Exploitation Viz’Eau : <strong>{exploitant}</strong>
        </p>
      )}
      <p className="fr-text--sm fr-mb-0" style={{ color: mentionColor }}>
        {[
          `${plural(parcelles.length, 'parcelle')} dans votre zone (${formatSurface(parcelles)} ha)`,
          `${selected.length} dans la sélection`,
          elsewhere > 0 &&
            `${elsewhere} rattachée${elsewhere > 1 ? 's' : ''} à une autre exploitation`,
        ]
          .filter(Boolean)
          .join(' · ')}
      </p>
      {missing.length > 0 ? (
        <Button
          size="small"
          iconId="fr-icon-add-line"
          iconPosition="left"
          onClick={() => onAddPacage(result)}
        >
          {missing.length > 1
            ? `Ajouter les ${missing.length} parcelles manquantes`
            : 'Ajouter la parcelle manquante'}
        </Button>
      ) : (
        <p className="fr-text--sm fr-mb-0">
          Toutes ses parcelles disponibles sont dans la sélection.
        </p>
      )}
      <ul className="flex flex-col fr-mb-0" style={{ listStyle: 'none', padding: 0 }}>
        {parcelles.map((p) => {
          // La sélection ne garde que les données de la parcelle, pas son rattachement
          const rpgParcelle = toSelectedParcelle(p)
          return (
            <ParcelleItem
              key={p.rpgId}
              parcelle={rpgParcelle}
              status={statusOf(p)}
              onClick={onParcelleClick}
              onHoverChange={onParcelleHover}
              action={
                <ToggleSwitch
                  label={<span className="fr-sr-only">Dans la sélection</span>}
                  inputTitle={`Parcelle RPG ${p.rpgId} dans la sélection`}
                  checked={selectedIds.has(p.rpgId)}
                  disabled={unavailableIds.has(p.rpgId)}
                  onChange={() => onToggle(rpgParcelle)}
                  showCheckedHint={false}
                  classes={{ root: 'fr-py-0' }}
                />
              }
            />
          )
        })}
      </ul>
    </>
  )
}
