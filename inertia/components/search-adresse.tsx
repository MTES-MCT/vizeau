import { useEffect, useMemo, useState } from 'react'
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

  const fetchAdresses = useMemo(
    () =>
      debounce(async (search: string) => {
        if (search.length > 3) {
          try {
            const response = await fetch(
              `https://data.geopf.fr/geocodage/search?q=${encodeURIComponent(search)}&limit=5`
            )
            const data = await response.json()

            setOptions(data.features)
          } catch (error) {
            console.error(error)
            setOptions([])
          }
          return
        }

        setOptions([])
      }, 300),
    []
  )

  useEffect(() => {
    return () => {
      fetchAdresses.cancel()
    }
  }, [fetchAdresses])

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
