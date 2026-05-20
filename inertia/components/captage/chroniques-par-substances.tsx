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
              options={substanceOptions}
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
