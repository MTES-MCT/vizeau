import { useState } from 'react'
import { fr } from '@codegouvfr/react-dsfr'
import SingleSelectMenu, { OptionType } from '~/ui/SingleSelectMenu'
import Loader from '~/ui/Loader'
import type { SubstanceItem, ChroniqueData } from '#types/captage'
import { useFetch } from '~/hooks/use-fetch'
import { SubstanceDetail } from './substance-detail'

type Props = {
  aacCode: string
  installationCode: string
  yearMin: number
  yearMax: number
}

function groupSubstances(list: SubstanceItem[]): {
  withDep: SubstanceItem[]
  withoutDep: SubstanceItem[]
  notDetected: SubstanceItem[]
} {
  const filtered = list.filter((s) => s.libelle_parametre && s.libelle_parametre.trim() !== '')
  const byName = (a: SubstanceItem, b: SubstanceItem) =>
    a.libelle_parametre.localeCompare(b.libelle_parametre)

  return {
    withDep: filtered.filter((s) => s.has_dep).sort(byName),
    withoutDep: filtered.filter((s) => !s.has_dep && s.max_value > 0).sort(byName),
    notDetected: filtered.filter((s) => !s.has_dep && s.max_value === 0).sort(byName),
  }
}

function toSelectOptions(
  substances: SubstanceItem[],
  selectedCode: number | null
): OptionType<number>[] {
  const { withDep, withoutDep, notDetected } = groupSubstances(substances)
  const toOption =
    (group: string) =>
    (s: SubstanceItem): OptionType<number> => ({
      value: s.code_parametre,
      label: s.libelle_parametre,
      isSelected: s.code_parametre === selectedCode,
      group,
      iconId: s.has_dep ? 'fr-icon-warning-fill' : undefined,
    })

  return [
    ...withDep.map(toOption('En dépassement')),
    ...withoutDep.map(toOption('Sans dépassement')),
    ...notDetected.map(toOption('Non détectée')),
  ]
}

export default function ChroniquesParSubstances({
  aacCode,
  installationCode,
  yearMin,
  yearMax,
}: Props) {
  const [selectedCode, setSelectedCode] = useState<number | null>(null)

  const baseUrl = `/aac/${aacCode}/installations/${installationCode}/analyses`
  const yearParams = `?yearMin=${yearMin}&yearMax=${yearMax}`

  const {
    data: substances,
    loading: loadingSubstances,
    error: errorSubstances,
  } = useFetch<SubstanceItem[]>(
    `${baseUrl}/substances${yearParams}`,
    'Impossible de charger les substances.',
    (data) => {
      const { withDep, withoutDep, notDetected } = groupSubstances(data)
      const first = withDep[0] ?? withoutDep[0] ?? notDetected[0]
      setSelectedCode(first ? first.code_parametre : null)
    }
  )

  const {
    data: chronique,
    loading: loadingChronique,
    error: errorChronique,
  } = useFetch<ChroniqueData>(
    selectedCode !== null ? `${baseUrl}/substances/${selectedCode}${yearParams}` : null,
    'Impossible de charger la chronique.'
  )

  const error = errorSubstances ?? errorChronique

  if (error) {
    return (
      <div className="fr-alert fr-alert--error fr-alert--sm">
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Substance selector */}
      <div
        className="fr-px-3w fr-py-2w"
        style={{ backgroundColor: fr.colors.decisions.background.alt.blueFrance.default }}
      >
        {loadingSubstances ? (
          <Loader type="dots" size="sm" />
        ) : (
          <div style={{ maxWidth: 400 }}>
            <SingleSelectMenu
              label="Sélectionnez une substance"
              options={toSelectOptions(substances ?? [], selectedCode)}
              onChange={(opt) => setSelectedCode(opt.value)}
            />
          </div>
        )}
      </div>

      {loadingChronique && (
        <div className="flex items-center gap-2 fr-py-2w">
          <Loader type="dots" size="sm" />
        </div>
      )}

      {!loadingChronique && chronique && <SubstanceDetail chronique={chronique} />}
    </div>
  )
}
