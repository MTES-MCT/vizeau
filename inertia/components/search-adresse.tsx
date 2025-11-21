import { useState } from 'react'
import SearchAutocomplete from './search-autocomplete'
import { debounce } from 'lodash-es'

export type Localisation = {
  type: string
  geometry: {
    type: string
    coordinates: number[]
  }
  properties: {
    name: string
    city: string
    label: string
    postcode: string
  }
}

export default function SearchAdresse({
  onChange,
  value,
}: {
  onChange: (value: Localisation) => void
  value: Localisation | null
}) {
  const [options, setOptions] = useState([])

  const fetchAdresses = debounce(async (search) => {
    if (search.length > 3) {
      const response = await fetch(`https://data.geopf.fr/geocodage/search?q=${search}&limit=5`)
      const data = await response.json()

      setOptions(data.features)
    }
  }, 300)

  return (
    <SearchAutocomplete
      label="Rechercher une adresse"
      placeholder="Rechercher une adresse"
      options={options}
      value={value || null}
      onChange={onChange}
      onInputChange={fetchAdresses}
      getOptionLabel={(opt) => opt.properties.label}
      disableClientFilter={true}
      renderOption={(opt) => <div>{opt.properties.label}</div>}
    />
  )
}
