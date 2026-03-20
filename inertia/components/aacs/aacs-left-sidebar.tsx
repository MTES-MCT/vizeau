import { ChangeEvent, useState, useEffect } from 'react'
import React from 'react'
import { SearchBar } from '@codegouvfr/react-dsfr/SearchBar'
import { Pagination, addPaginationTranslations } from '@codegouvfr/react-dsfr/Pagination'
import LocationFrance from '@codegouvfr/react-dsfr/picto/LocationFrance'
import { debounce } from 'lodash-es'
import { router } from '@inertiajs/react'
import type { AacSummaryJson } from '../../../types/models'
import EmptyPlaceholder from '~/ui/EmptyPlaceholder'
import ListItem from '~/ui/ListItem'
import { formatDateFr } from '~/functions/date'
import { Button } from '@codegouvfr/react-dsfr/Button'
import { fr } from '@codegouvfr/react-dsfr'

type AACsLeftSidebarProps = {
  aacs: AacSummaryJson[]
  queryString: {
    aacRecherche: string
    aacCommune: string
    aacPage: string
  }
  meta: {
    total: number
    perPage: number
    currentPage: number
    lastPage: number
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

addPaginationTranslations({
  lang: 'fr',
  messages: {
    'first page': 'Première page',
    'previous page': '',
    'next page': '',
    'last page': 'Dernière page',
    'aria-label': 'Pagination',
  },
})

export default function AACsLeftSidebar({ aacs, queryString, meta }: AACsLeftSidebarProps) {
  const [isFiltersVisible, setIsFiltersVisible] = useState(false)
  const [communeFilter, setCommuneFilter] = useState(queryString?.aacCommune || '')

  useEffect(() => {
    setCommuneFilter(queryString?.aacCommune || '')
  }, [queryString?.aacCommune])

  return (
    <div>
      <div className="fr-p-1w">
        <div className="flex flex-col gap-5">
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
          {aacs.length === 0 ? (
            <EmptyPlaceholder
              label={
                queryString?.aacRecherche && queryString?.aacCommune
                  ? `Aucun résultat pour "${queryString.aacRecherche}" dans la commune "${queryString.aacCommune}"`
                  : queryString?.aacRecherche
                    ? `Aucun résultat trouvé pour "${queryString.aacRecherche}"`
                    : queryString?.aacCommune
                      ? `Aucun résultat pour la commune "${queryString.aacCommune}"`
                      : 'Aucune AAC enregistrée'
              }
              pictogram={LocationFrance}
            />
          ) : (
            <div className="flex flex-col gap-1">
              <span
                className="fr-text--sm fr-mb-0"
                style={{
                  color: fr.colors.decisions.text.mention.grey.default,
                }}
              >
                <span className="font-bold">{meta.total}</span>{' '}
                {`air${meta.total > 1 ? 's' : ''} d'alimentation de captage`}
              </span>
              <div className="flex flex-col gap-2">
                {aacs.map((aac, index) => {
                  return (
                    <ListItem
                      key={aac.code}
                      title={aac.nom}
                      linkProps={{ href: `/aac/${aac.code}` }}
                      priority={index % 2 === 0 ? 'primary' : 'secondary'}
                      metas={[
                        { content: `${formatDateFr(aac.date_maj)}`, iconId: 'fr-icon-time-line' },
                        { content: `${Math.round(aac.surface)} ha`, iconId: 'fr-icon-ruler-line' },
                        {
                          content: `${aac.nb_communes} commune${aac.nb_communes > 1 ? 's' : ''}`,
                          iconId: 'fr-icon-government-line',
                        },
                      ]}
                    />
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {meta.lastPage > 1 && (
          <div
            className="fr-p-1w"
            style={{
              boxShadow: '0 -4px 6px 0 rgba(0, 0, 0, 0.10)',
            }}
          >
            <Pagination
              count={meta.lastPage}
              defaultPage={meta.currentPage}
              showFirstLast={false}
              getPageLinkProps={(pageNumber) => ({
                href: '#',
                onClick: (e: React.MouseEvent) => {
                  e.preventDefault()
                  router.reload({
                    only: ['aacs', 'aacMeta', 'aacQueryString'],
                    data: { aacPage: String(pageNumber) },
                    replace: true,
                  })
                },
              })}
            />
          </div>
        )}
      </div>
    </div>
  )
}
