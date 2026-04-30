import { ChangeEvent, useEffect, useMemo, useState } from 'react'

import { debounce } from 'lodash-es'
import { router } from '@inertiajs/react'
import { fr } from '@codegouvfr/react-dsfr'

import { Button } from '@codegouvfr/react-dsfr/Button'
import { SearchBar } from '@codegouvfr/react-dsfr/SearchBar'

export type AacsSearchProps = {
  queryString: {
    aacRecherche: string
    aacCommune: string
    aacPage: string
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

  const handleSearch = useMemo(
    () =>
      debounce((value: string) => {
        router.reload({
          only: reloadOnly,
          data: { aacRecherche: value, aacPage: '1' },
          replace: true,
        })
      }, 300),
    [reloadOnly]
  )

  const handleCommuneFilter = useMemo(
    () =>
      debounce((value: string) => {
        router.reload({
          only: reloadOnly,
          data: { aacCommune: value, aacPage: '1' },
          replace: true,
        })
      }, 300),
    [reloadOnly]
  )

  useEffect(() => {
    return () => {
      handleSearch.cancel()
      handleCommuneFilter.cancel()
    }
  }, [handleSearch, handleCommuneFilter])

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
        </div>
      )}
    </div>
  )
}
