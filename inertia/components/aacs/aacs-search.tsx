import { ChangeEvent, useEffect, useState } from 'react'

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
}

const handleSearch = debounce((value: string) => {
  router.reload({
    only: ['aacs', 'aacMeta', 'aacQueryString'],
    data: { aacRecherche: value, aacPage: '1' },
    replace: true,
  })
}, 300)

const handleCommuneFilter = debounce((value: string) => {
  router.reload({
    only: ['aacs', 'aacMeta', 'aacQueryString'],
    data: { aacCommune: value, aacPage: '1' },
    replace: true,
  })
}, 300)

export default function AacsSearch({ queryString }: AacsSearchProps) {
  const [isFiltersVisible, setIsFiltersVisible] = useState(false)
  const [communeFilter, setCommuneFilter] = useState(queryString?.aacCommune || '')

  useEffect(() => {
    setCommuneFilter(queryString?.aacCommune || '')
  }, [queryString?.aacCommune])

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
              defaultValue={queryString?.aacRecherche || ''}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
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
                  setCommuneFilter('')
                  router.reload({
                    only: ['aacs', 'aacMeta', 'aacQueryString'],
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
