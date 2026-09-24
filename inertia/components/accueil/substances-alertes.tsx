import { useState } from 'react'
import { fr } from '@codegouvfr/react-dsfr'
import Select from '@codegouvfr/react-dsfr/Select'
import Tag from '@codegouvfr/react-dsfr/Tag'
import type { TerritoireJson } from '#types/models'
import type { SubstancesRepartitionJson } from '#types/captage'
import SectionCard from '~/ui/SectionCard'
import EmptyPlaceholder from '~/ui/EmptyPlaceholder'

export type SubstancesAlertesProps = {
  territoires: TerritoireJson[]
  substancesRepartition?: SubstancesRepartitionJson
}

const TOUS_TERRITOIRES = 'tous'

export default function SubstancesAlertes({
  territoires,
  substancesRepartition,
}: SubstancesAlertesProps) {
  const [selectedTerritoireId, setSelectedTerritoireId] = useState<string>(TOUS_TERRITOIRES)

  const substances =
    selectedTerritoireId === TOUS_TERRITOIRES
      ? (substancesRepartition?.tousTerritoires ?? [])
      : (substancesRepartition?.parTerritoire[selectedTerritoireId] ?? [])

  return (
    <SectionCard
      title="Top 5 des substances à risque"
      caption="Dépassement calculés sur les dernières analyses"
      background="secondary"
      size="small"
    >
      <div className="flex flex-col gap-3 w-fill">
        <Select
          label=""
          className="fr-mb-0 w-56 w-full"
          nativeSelectProps={{
            value: selectedTerritoireId,
            onChange: (e) => setSelectedTerritoireId(e.target.value),
          }}
        >
          <option value={TOUS_TERRITOIRES}>Tous mes territoires</option>
          {territoires.map((territoire) => (
            <option key={territoire.id} value={territoire.id}>
              {territoire.nom}
            </option>
          ))}
        </Select>
        {substances.length > 0 ? (
          <ul className="flex flex-col gap-2 fr-p-0 fr-m-0">
            {substances.map((substance) => {
              const isReglementaire = substance.type === 'reglementaire'
              const color = isReglementaire
                ? fr.colors.decisions.text.default.error.default
                : fr.colors.decisions.text.default.warning.default
              const background = isReglementaire
                ? fr.colors.decisions.background.contrast.error.default
                : fr.colors.decisions.background.contrast.warning.default

              return (
                <li
                  key={substance.code_parametre}
                  className="flex justify-between items-center gap-2 fr-p-2v"
                  style={{
                    listStyle: 'none',
                    border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
                    background: fr.colors.decisions.background.default.grey.default,
                  }}
                >
                  <div className="flex flex-col">
                    <strong className="fr-text--sm fr-mb-0">{substance.libelle_parametre}</strong>
                    <span
                      className="fr-text--xs fr-mb-0"
                      style={{ color: fr.colors.decisions.text.mention.grey.default }}
                    >
                      {substance.derniere_valeur.toLocaleString('fr-FR')} {substance.code_unite}
                    </span>
                  </div>
                  <Tag small style={{ background, color }}>
                    {substance.taux_depassement.toLocaleString('fr-FR')} %
                  </Tag>
                </li>
              )
            })}
          </ul>
        ) : (
          <EmptyPlaceholder label="Aucune substance en dépassement sur ce territoire." />
        )}
      </div>
    </SectionCard>
  )
}
