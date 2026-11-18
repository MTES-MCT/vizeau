import { fr } from '@codegouvfr/react-dsfr'
import Tag from '@codegouvfr/react-dsfr/Tag'
import { useMemo, useState } from 'react'

import type { SelectedParcelle } from '~/components/map/parcelles-selection-map'
import CulturesRepartition from '~/components/parcelle/parcelles-workspace/cultures-repartition'
import ParcelleItem from '~/components/parcelle/parcelles-workspace/parcelle-item'
import {
  formatHectares,
  getCulturesSegments,
  plural,
} from '~/components/parcelle/parcelles-workspace/selection'
import { getCultureByCode } from '~/functions/cultures_group'
import ButtonWithSelector from '~/ui/ButtonWithSelector'
import EmptyPlaceholder from '~/ui/EmptyPlaceholder'

const listClassName = 'flex flex-col fr-mb-0'
const listStyle = { listStyle: 'none', padding: 0 }

export type SelectionPanelProps = {
  millesime: string
  /** Titre de la liste des parcelles, selon ce à quoi elles sont rattachées. */
  title: string
  parcelles: SelectedParcelle[]
  /** Parcelles de la sélection absentes au départ, ajoutées dans le brouillon. */
  addedParcelleIds: Set<string>
  onParcelleClick: (parcelle: SelectedParcelle) => void
}

export default function SelectionPanel({
  millesime,
  title,
  parcelles,
  addedParcelleIds,
  onParcelleClick,
}: SelectionPanelProps) {
  const culturesSegments = useMemo(() => getCulturesSegments(parcelles), [parcelles])
  const culturesTotalHa = culturesSegments.reduce((a, culture) => {
    return a + culture.value
  }, 0)

  const mentionColor = fr.colors.decisions.text.mention.grey.default

  const [selectedCultures, setSelectedCultures] = useState<Set<string>>(new Set())

  const cultureFilter = culturesSegments
    .map((culture) => culture.label)
    .filter((label) => selectedCultures.has(label))

  const filteredParcelles = parcelles.filter(
    (parcelle) =>
      cultureFilter.length === 0 ||
      cultureFilter.includes(getCultureByCode(parcelle.cultureCode).label)
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

  if (parcelles.length === 0) {
    return (
      <div className="flex flex-col">
        <EmptyPlaceholder
          label={`Aucune parcelle sélectionnée pour le RPG ${millesime}`}
          illustrativeIcon="fr-icon-collage-line"
        />
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

      <div className="flex flex-col gap-2">
        {cultureFilterBlock}
        {filteredParcelles.length === 0 ? (
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
                onClick={onParcelleClick}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
