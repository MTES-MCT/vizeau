import { fr } from '@codegouvfr/react-dsfr'
import {
  SegmentedControl,
  type SegmentedControlProps,
} from '@codegouvfr/react-dsfr/SegmentedControl'
import Tag from '@codegouvfr/react-dsfr/Tag'
import { useMemo, useState } from 'react'

import type { SelectedParcelle } from '~/components/map/parcelles-selection-map'
import CulturesRepartition from '~/components/parcelle/parcelles-workspace/cultures-repartition'
import ExploitationsGrouping from '~/components/parcelle/parcelles-workspace/exploitations-grouping'
import ParcelleItem from '~/components/parcelle/parcelles-workspace/parcelle-item'
import PacagesGrouping from '~/components/parcelle/parcelles-workspace/pacages-grouping'
import ParcellesDrawer from '~/components/parcelle/parcelles-workspace/parcelles-drawer'
import {
  formatHectares,
  getCulturesSegments,
  normalizeSearch,
  plural,
} from '~/components/parcelle/parcelles-workspace/selection'
import type { ExploitationsDraft } from '~/components/parcelle/parcelles-workspace/use_exploitations_draft'
import type { PacagesDraft } from '~/components/parcelle/parcelles-workspace/use_pacages_draft'
import { getCultureByCode } from '~/functions/cultures_group'
import { getParcelleExploitations } from '~/functions/projet_parcelles'
import ButtonWithSelector from '~/ui/ButtonWithSelector'
import EmptyPlaceholder from '~/ui/EmptyPlaceholder'
import SearchWithFilters from '~/ui/SearchWithFilters'

export type GroupBy = 'toutes' | 'exploitations' | 'pacage'

const listClassName = 'flex flex-col fr-mb-0'
const listStyle = { listStyle: 'none', padding: 0 }

export type SelectionPanelProps = {
  millesime: string
  /** Titre de la liste des parcelles, selon ce à quoi elles sont rattachées. */
  title: string
  parcelles: SelectedParcelle[]
  /** Parcelles de la sélection absentes au départ, ajoutées dans le brouillon. */
  addedParcelleIds: Set<string>
  /** Parcelles initialement attachées et retirées dans le brouillon. */
  removedParcelles: SelectedParcelle[]
  onParcelleClick: (parcelle: SelectedParcelle) => void
  onParcelleRestore: (parcelle: SelectedParcelle) => void
  /** Exploitations du projet : permet de regrouper les parcelles par exploitation ajoutée. */
  exploitations?: ExploitationsDraft
  /** PACAGE ajoutés : permet de regrouper les parcelles par PACAGE. */
  pacages?: PacagesDraft
  /** Regroupement de la liste, gardé par l'écran parent pour suivre la méthode d'ajout. */
  groupBy: GroupBy
  onGroupByChange: (groupBy: GroupBy) => void
}

export default function SelectionPanel({
  millesime,
  title,
  parcelles,
  addedParcelleIds,
  removedParcelles,
  onParcelleClick,
  onParcelleRestore,
  exploitations,
  pacages,
  groupBy,
  onGroupByChange,
}: SelectionPanelProps) {
  const canGroupByExploitation = Boolean(exploitations)
  const groupBySegments: { value: GroupBy; label: string }[] = [
    { value: 'toutes', label: 'Toutes' },
    ...(exploitations ? [{ value: 'exploitations' as const, label: 'Par exploitation' }] : []),
    ...(pacages ? [{ value: 'pacage' as const, label: 'Par PACAGE' }] : []),
  ]
  // Sans exploitations fournies (hors projet), la parcelle ne porte pas de meta d'exploitation
  const parcelleExploitations = useMemo(
    () => exploitations && getParcelleExploitations(exploitations.list, millesime),
    [exploitations, millesime]
  )
  const getExploitationName = (parcelle: SelectedParcelle) => {
    if (!parcelleExploitations) return undefined
    const projectName = parcelleExploitations.get(parcelle.rpgId)?.name
    if (projectName) return projectName
    // Exploitation connue par le PACAGE qui a servi à ajouter la parcelle
    const exploitant = pacages?.getExploitant(parcelle.rpgId)
    return exploitant ? `${exploitant} (hors projet)` : 'Hors exploitations du projet'
  }

  const culturesSegments = useMemo(() => getCulturesSegments(parcelles), [parcelles])
  const culturesTotalHa = culturesSegments.reduce((a, culture) => {
    return a + culture.value
  }, 0)

  const mentionColor = fr.colors.decisions.text.mention.grey.default

  const [selectedCultures, setSelectedCultures] = useState<Set<string>>(new Set())

  const cultureFilter = culturesSegments
    .map((culture) => culture.label)
    .filter((label) => selectedCultures.has(label))
  const [exploitationSearch, setExploitationSearch] = useState('')
  // Les tiroirs PACAGE portent un numéro, pas un nom d'exploitation : pas de recherche par nom
  const hasExploitationSearch = canGroupByExploitation && groupBy !== 'pacage'
  const exploitationNeedle = hasExploitationSearch ? normalizeSearch(exploitationSearch) : ''
  const matchesExploitationSearch = (name: string) =>
    normalizeSearch(name).includes(exploitationNeedle)

  const filteredParcelles = parcelles.filter(
    (parcelle) =>
      (cultureFilter.length === 0 ||
        cultureFilter.includes(getCultureByCode(parcelle.cultureCode).label)) &&
      (!exploitationNeedle || matchesExploitationSearch(getExploitationName(parcelle) ?? ''))
  )

  const toggleCulture = (label: string, isSelected: boolean) => {
    const next = new Set(selectedCultures)
    if (isSelected) next.add(label)
    else next.delete(label)
    setSelectedCultures(next)
  }

  const cultureFilterBlock = culturesSegments.length > 1 && (
    <div className="flex flex-col gap-2">
      <ButtonWithSelector
        label="Filtrer par culture"
        options={culturesSegments.map((culture) => ({
          value: culture.label,
          label: culture.label,
          isSelected: cultureFilter.includes(culture.label),
        }))}
        onOptionChange={(option) => toggleCulture(option.value, option.isSelected)}
      />
      {cultureFilter.length > 0 && (
        <ul className="flex flex-wrap gap-1 fr-p-0 fr-m-0">
          {cultureFilter.map((label) => (
            <li key={label} style={{ listStyle: 'none' }}>
              <Tag
                small
                dismissible
                nativeButtonProps={{ onClick: () => toggleCulture(label, false) }}
              >
                {label}
              </Tag>
            </li>
          ))}
        </ul>
      )}
    </div>
  )

  const removedSurface = removedParcelles.reduce(
    (sum, parcelle) => sum + (parcelle.surface ?? 0),
    0
  )
  const removedSection = removedParcelles.length > 0 && (
    <div className="fr-mt-3w">
      <ParcellesDrawer
        variant="removed"
        title={`${plural(removedParcelles.length, 'parcelle')} retirée${removedParcelles.length > 1 ? 's' : ''}`}
        summary={`−${formatHectares(removedSurface)} ha · seront détachées de la sélection initiale à la validation`}
      >
        <ul className={listClassName} style={listStyle}>
          {removedParcelles.map((parcelle) => (
            <ParcelleItem
              key={parcelle.rpgId}
              parcelle={parcelle}
              exploitationName={getExploitationName(parcelle)}
              onClick={onParcelleClick}
              onRestore={onParcelleRestore}
            />
          ))}
        </ul>
      </ParcellesDrawer>
    </div>
  )

  if (parcelles.length === 0) {
    return (
      <div className="flex flex-col">
        <EmptyPlaceholder
          label={`Aucune parcelle sélectionnée pour le RPG ${millesime}`}
          illustrativeIcon="fr-icon-collage-line"
        />
        {removedSection}
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <section
        className="fr-pb-2w fr-mb-2w border-b"
        style={{ borderColor: fr.colors.decisions.border.default.grey.default }}
      >
        <h3 className="fr-text--sm fr-mb-1v" style={{ color: mentionColor }}>
          {title}
        </h3>
        <p className="fr-text--lg fr-mb-1w">
          <b>{plural(parcelles.length, 'parcelle')}</b> · {formatHectares(culturesTotalHa)} ha
        </p>
        <CulturesRepartition segments={culturesSegments} />
      </section>

      {groupBySegments.length > 1 && (
        <div className="fr-pb-3v">
          <SegmentedControl
            small
            inlineLegend
            legend="Afficher :"
            segments={
              groupBySegments.map(({ value, label }) => ({
                label,
                nativeInputProps: {
                  checked: groupBy === value,
                  onChange: () => onGroupByChange(value),
                },
              })) as SegmentedControlProps.Segments
            }
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        {hasExploitationSearch ? (
          <SearchWithFilters
            searchPlaceholder="Rechercher par exploitation"
            defaultSearchValue={exploitationSearch}
            onSearchChange={(event) => setExploitationSearch(event.target.value)}
          >
            {cultureFilterBlock}
          </SearchWithFilters>
        ) : (
          cultureFilterBlock
        )}
        {canGroupByExploitation && groupBy === 'exploitations' ? (
          <ExploitationsGrouping
            millesime={millesime}
            parcelles={filteredParcelles}
            addedParcelleIds={addedParcelleIds}
            exploitations={exploitations!}
            isFiltered={cultureFilter.length > 0 || Boolean(exploitationNeedle)}
            onParcelleClick={onParcelleClick}
          />
        ) : pacages && groupBy === 'pacage' ? (
          <PacagesGrouping
            millesime={millesime}
            parcelles={filteredParcelles}
            addedParcelleIds={addedParcelleIds}
            pacages={pacages}
            isFiltered={cultureFilter.length > 0 || Boolean(exploitationNeedle)}
            onParcelleClick={onParcelleClick}
          />
        ) : filteredParcelles.length === 0 ? (
          <EmptyPlaceholder
            label="Aucune parcelle ne correspond aux filtres"
            illustrativeIcon="fr-icon-search-line"
          />
        ) : (
          <ul className={listClassName} style={listStyle}>
            {filteredParcelles.map((parcelle) => (
              <ParcelleItem
                key={parcelle.rpgId}
                parcelle={parcelle}
                isNew={addedParcelleIds.has(parcelle.rpgId)}
                exploitationName={getExploitationName(parcelle)}
                onClick={onParcelleClick}
              />
            ))}
          </ul>
        )}
      </div>

      {removedSection}
    </div>
  )
}
