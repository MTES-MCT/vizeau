import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'

import { debounce } from 'lodash-es'
import { router } from '@inertiajs/react'
import { fr } from '@codegouvfr/react-dsfr'

import { Button } from '@codegouvfr/react-dsfr/Button'
import { SearchBar } from '@codegouvfr/react-dsfr/SearchBar'
import Checkbox from '@codegouvfr/react-dsfr/Checkbox'

export type AacsSearchProps = {
  queryString: {
    aacRecherche: string
    aacCommune: string
    aacPage: string
    aacDepassementsReglementaires?: string
    aacDepassementsAlerte?: string
  }
  reloadOnly: string[]
}

export default function AacsSearch({ queryString, reloadOnly }: AacsSearchProps) {
  const [isFiltersVisible, setIsFiltersVisible] = useState(false)

  // The inputs are initialized from the URL once, then kept fully local.
  // This prevents a late Inertia response from overwriting what the user
  // is still typing.
  const [searchValue, setSearchValue] = useState(queryString?.aacRecherche || '')
  const [communeFilter, setCommuneFilter] = useState(queryString?.aacCommune || '')
  const [depReglFilter, setDepReglFilter] = useState(
    queryString?.aacDepassementsReglementaires === 'true'
  )
  const [depAlertFilter, setDepAlertFilter] = useState(
    queryString?.aacDepassementsAlerte === 'true'
  )

  // Keep a stable ref to reloadOnly so the debounced functions never need to
  // be recreated (and therefore never get cancelled) when the prop identity changes.
  const reloadOnlyRef = useRef(reloadOnly)
  useEffect(() => {
    reloadOnlyRef.current = reloadOnly
  }, [reloadOnly])

  const handleSearch = useMemo(
    () =>
      debounce((value: string) => {
        router.reload({
          only: reloadOnlyRef.current,
          data: { aacRecherche: value, aacPage: '1' },
          replace: true,
        })
      }, 300),
    [] // stable — uses ref internally
  )

  const handleCommuneFilter = useMemo(
    () =>
      debounce((value: string) => {
        router.reload({
          only: reloadOnlyRef.current,
          data: { aacCommune: value, aacPage: '1' },
          replace: true,
        })
      }, 300),
    [] // stable — uses ref internally
  )

  useEffect(() => {
    return () => {
      handleSearch.cancel()
      handleCommuneFilter.cancel()
    }
  }, [handleSearch, handleCommuneFilter])

  const handleDepReglFilterToggle = (checked: boolean) => {
    setDepReglFilter(checked)
    router.reload({
      only: reloadOnlyRef.current,
      data: { aacDepassementsReglementaires: String(checked), aacPage: '1' },
      replace: true,
    })
  }

  const handleDepAlertFilterToggle = (checked: boolean) => {
    setDepAlertFilter(checked)
    router.reload({
      only: reloadOnlyRef.current,
      data: { aacDepassementsAlerte: String(checked), aacPage: '1' },
      replace: true,
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1">
        <SearchBar
          className="flex-1 fr-m-0v"
          renderInput={({ className, id, type }) => (
            <input
              className={className}
              id={id}
              type={type}
              placeholder="Rechercher par code ou nom d'AAC"
              value={searchValue}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setSearchValue(e.target.value)
                handleSearch(e.target.value)
              }}
            />
          )}
        />
        <Button
          iconId="fr-icon-filter-line"
          title="Filtrer"
          priority={isFiltersVisible ? 'primary' : 'secondary'}
          onClick={() => setIsFiltersVisible(!isFiltersVisible)}
        />
      </div>

      {isFiltersVisible && (
        <div
          className="fr-p-2w"
          style={{
            border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
          }}
        >
          <span className="fr-text--lg font-bold">Filtres</span>

          <div className="flex gap-1 items-center">
            <SearchBar
              className="flex-1"
              renderInput={({ className, id, type }) => (
                <input
                  className={className}
                  id={id}
                  type={type}
                  placeholder="Filtrer par commune"
                  value={communeFilter}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    setCommuneFilter(e.target.value)
                    handleCommuneFilter(e.target.value)
                  }}
                />
              )}
            />
            {queryString?.aacCommune && (
              <Button
                title="Effacer la recherche"
                iconId="fr-icon-close-line"
                priority="tertiary no outline"
                size="small"
                onClick={() => {
                  handleCommuneFilter.cancel()
                  setCommuneFilter('')
                  router.reload({
                    only: reloadOnly,
                    data: { aacCommune: '', aacPage: '1' },
                    replace: true,
                  })
                }}
              />
            )}
          </div>

          <Checkbox
            small
            options={[
              {
                label: 'Dépassements réglementaires',
                nativeInputProps: {
                  name: 'aacDepassementsReglementaires',
                  checked: depReglFilter,
                  onChange: (e: ChangeEvent<HTMLInputElement>) =>
                    handleDepReglFilterToggle(e.target.checked),
                },
              },
              {
                label: "Dépassements d'alerte",
                nativeInputProps: {
                  name: 'aacDepassementsAlerte',
                  checked: depAlertFilter,
                  onChange: (e: ChangeEvent<HTMLInputElement>) =>
                    handleDepAlertFilterToggle(e.target.checked),
                },
              },
            ]}
          />
        </div>
      )}
    </div>
  )
}
