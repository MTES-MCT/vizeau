import { useState } from 'react'
import { debounce } from 'lodash-es'
import {fr} from '@codegouvfr/react-dsfr'
import SearchAutocomplete from './search-autocomplete'

export type Company = {
  nom_complet: string
  siren: string
  siege: {
    libelle_commune: string
    siret: string
    activite_principale: string
    code_postal: string
  }
}

export default function SearchRaisonSociale({
  onChange,
  value,
}: {
  onChange: (value: Company) => void
  value: Company | null
}) {
  const [options, setOptions] = useState<Company[]>([])

  const fetchCompanies = debounce(async (search) => {
    if (search.length > 3) {
      const response = await fetch(`https://recherche-entreprises.api.gouv.fr/search?q=${search}`)
      const data = await response.json()
      setOptions(data.results)
    }
  }, 300)

  console.log('options', options)

  return (
    <SearchAutocomplete<Company>
      label="Raison sociale de l'exploitation *"
      placeholder="Rechercher une raison sociale"
      options={options}
      value={value ?? null}
      onChange={onChange}
      renderOption={(opt) => (
        <div className="flex justify-between">
          <div>
            <div>{opt.nom_complet}</div>
            <div style={{color: fr.colors.decisions.text.mention.grey.default}}><small>{opt.siege.code_postal} - {opt.siege.libelle_commune}</small></div>
          </div>
          <div className="flex items-center">
            <span style={{color: fr.colors.decisions.text.mention.grey.default}}><small>{opt.siren}</small></span>
          </div>
        </div>
      )}
      getOptionLabel={(opt) => opt.nom_complet}
      getOptionKey={(company) => company.siren}
      onInputChange={fetchCompanies}
      required
    />
  )
}
