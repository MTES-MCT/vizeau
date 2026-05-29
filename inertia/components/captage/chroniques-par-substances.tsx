import { useState } from 'react'
import SingleSelectMenu, { OptionType } from '~/ui/SingleSelectMenu'
import Loader from '~/ui/Loader'
import type { SubstanceItem, ChroniqueData } from '#types/captage'
import { useFetch } from '~/hooks/use_fetch'
import { SubstanceDetail } from './substance-detail'

type Props = {
  aacCode: string
  installationCode: string
  yearMin: number
  yearMax: number
  initialSubstanceCode?: number | null
}

export default function ChroniquesParSubstances({
  aacCode,
  installationCode,
  yearMin,
  yearMax,
  initialSubstanceCode,
}: Props) {
  const [selectedCode, setSelectedCode] = useState<number | null>(initialSubstanceCode ?? null)

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
      if (initialSubstanceCode != null) return
      const filtered = data.filter((s) => s.libelle_parametre?.trim())
      const first =
        filtered.find((s) => s.has_dep) ??
        filtered.find((s) => !s.has_dep && s.max_value > 0) ??
        filtered.find((s) => s.max_value === 0)
      setSelectedCode(first?.code_parametre ?? null)
    }
  )

  const sorted = (substances ?? [])
    .filter((s) => s.libelle_parametre?.trim())
    .sort((a, b) => a.libelle_parametre.localeCompare(b.libelle_parametre))

  const substanceOptions: OptionType<number>[] = [
    ...sorted.filter((s) => s.has_dep),
    ...sorted.filter((s) => !s.has_dep && s.max_value > 0),
    ...sorted.filter((s) => !s.has_dep && s.max_value === 0),
  ].map((s) => ({
    value: s.code_parametre,
    label: s.libelle_parametre,
    isSelected: s.code_parametre === selectedCode,
    group: s.has_dep ? 'En dépassement' : s.max_value > 0 ? 'Sans dépassement' : 'Non détectée',
    iconId: s.has_dep ? 'fr-icon-warning-fill' : undefined,
  }))

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

  const substanceSelector = loadingSubstances ? (
    <Loader type="dots" size="sm" />
  ) : (
    <div className="w-[300px]">
      <SingleSelectMenu
        options={substanceOptions}
        onChange={(option) => setSelectedCode(option.value)}
      />
    </div>
  )

  return (
    <SubstanceDetail
      chronique={chronique ?? null}
      loading={loadingChronique}
      headerContent={substanceSelector}
    />
  )
}
