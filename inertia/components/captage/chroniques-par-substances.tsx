import { useState } from 'react'
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
      setSelectedCode(data.length > 0 ? data[0].code_parametre : null)
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

  const substanceSelector = loadingSubstances ? (
    <Loader type="dots" size="sm" />
  ) : (
    <Select
      label=""
      nativeSelectProps={{
        id: 'substance-select',
        value: selectedCode ?? '',
        onChange: (e) => setSelectedCode(Number(e.target.value)),
      }}
      style={{ marginBottom: 0, maxWidth: '50%' }}
    >
      {(substances ?? []).map((s) => (
        <option key={s.code_parametre} value={s.code_parametre}>
          {s.libelle_parametre}
          {s.has_dep ? ' ⚠' : ''}
        </option>
      ))}
    </Select>
  )

  return (
    <SubstanceDetail
      chronique={chronique ?? null}
      loading={loadingChronique}
      headerContent={substanceSelector}
    />
  )
}
