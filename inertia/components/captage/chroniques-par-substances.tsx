import { useState } from 'react'
import { fr } from '@codegouvfr/react-dsfr'
import Select from '@codegouvfr/react-dsfr/Select'
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
          <Select
            label="Sélectionnez une substance"
            nativeSelectProps={{
              id: 'substance-select',
              value: selectedCode ?? '',
              onChange: (e) => setSelectedCode(Number(e.target.value)),
            }}
            style={{ marginBottom: 0, maxWidth: 400 }}
          >
            {(() => {
              const { withDep, withoutDep, notDetected } = groupSubstances(substances ?? [])
              const renderOption = (s: SubstanceItem) => (
                <option key={s.code_parametre} value={s.code_parametre}>
                  {s.libelle_parametre}
                  {s.has_dep ? ' ⚠' : ''}
                </option>
              )
              return (
                <>
                  {withDep.length > 0 && (
                    <optgroup label="En dépassement">{withDep.map(renderOption)}</optgroup>
                  )}
                  {withoutDep.length > 0 && (
                    <optgroup label="Sans dépassement">{withoutDep.map(renderOption)}</optgroup>
                  )}
                  {notDetected.length > 0 && (
                    <optgroup label="Non détectée">{notDetected.map(renderOption)}</optgroup>
                  )}
                </>
              )
            })()}
          </Select>
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
