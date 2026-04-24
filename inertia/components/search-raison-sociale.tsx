import { useEffect, useMemo, useRef, useState } from 'react'
import { debounce } from 'lodash-es'
import { fr } from '@codegouvfr/react-dsfr'
import SearchAutocomplete from './search-autocomplete'

export type RaisonSociale = {
  name: string
  nom_complet: string
  siren?: string
  siret?: string
  categorie_entreprise: string
  activite_principale: string
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
  error,
}: {
  onChange: (value: RaisonSociale) => void
  value: RaisonSociale | null
  error?: { [key: string]: any }
}) {
  const [options, setOptions] = useState<RaisonSociale[]>([])
  const abortRef = useRef<AbortController | null>(null)

  const fetchCompanies = useMemo(
    () =>
      debounce(async (search: string) => {
        if (search.length > 2) {
          // Abort the previous request to avoid that too many requests are fired
          if (abortRef.current) {
            abortRef.current.abort()
          }
          const controller = new AbortController()
          abortRef.current = controller

          try {
            const response = await fetch(
              `https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(search)}`,
              { signal: controller.signal }
            )

            if (!response.ok) {
              const dataText = await response.text()
              throw new Error(`Erreur API: ${response.status} (${dataText})`)
            }

            const data = await response.json()
            setOptions(data.results)
          } catch (error) {
            // Ignore request abortion errors
            if (error?.name === 'AbortError') {
              return
            }
            console.error(error)
            setOptions([])
          }
          return
        }

        setOptions([])
      }, 400),
    []
  )

  useEffect(() => {
    return () => {
      fetchCompanies.cancel()
      abortRef.current?.abort()
    }
  }, [fetchCompanies])

  return (
    <SearchAutocomplete<RaisonSociale>
      label="Raison sociale de l'exploitation *"
      placeholder="Rechercher une raison sociale"
      options={options}
      value={value ?? null}
      onChange={onChange}
      error={error}
      renderOption={(opt) => (
        <div className="flex justify-between">
          <div>
            <div>{opt.nom_complet}</div>
            <div style={{ color: fr.colors.decisions.text.mention.grey.default }}>
              <small>
                {opt.siege.code_postal} - {opt.siege.libelle_commune}
              </small>
            </div>
          </div>
          <div className="flex items-center">
            <span style={{ color: fr.colors.decisions.text.mention.grey.default }}>
              <small>{opt.siret}</small>
            </span>
          </div>
        </div>
      )}
      getOptionLabel={(opt) => opt.nom_complet}
      getOptionKey={(company) => company.siret ?? company.siege.siret}
      onInputChange={fetchCompanies}
      disableClientFilter={true}
      required
    />
  )
}
