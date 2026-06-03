import { ChangeEvent, useCallback, useState } from 'react'
import { router } from '@inertiajs/react'

import { ProjetsTabsJson } from '#types/models'
import { debounce } from 'lodash-es'

import { Tabs } from '@codegouvfr/react-dsfr/Tabs'
import Tag from '@codegouvfr/react-dsfr/Tag'
import { Range } from '@codegouvfr/react-dsfr/Range'
import { Pagination } from '@codegouvfr/react-dsfr/Pagination'
import SearchWithFilters from '~/ui/SearchWithFilters'
import ProjetsList from './projets-list'
import EmptyPlaceholder from '~/ui/EmptyPlaceholder'

export default function ProjetsTabs({
  projets,
  meta,
  queryString,
  availableActionTypes,
  availableYearRange,
  statusCounts,
}: ProjetsTabsJson) {
  // selectedTab drives which tab is visually active; initialised from the URL so that
  // browser back/forward and hard reloads restore the correct tab instantly.
  const [selectedTab, setSelectedTab] = useState(queryString.projetsStatut || 'all')

  // Derive filter sets from the URL — no local state needed for these.
  const deselectedTypesAction = new Set(
    queryString.projetsTypesActionExclus ? queryString.projetsTypesActionExclus.split(',') : []
  )
  const deselectedStatuts = new Set(
    queryString.projetsStatutsExclus ? queryString.projetsStatutsExclus.split(',') : []
  )

  // Local year state gives the slider immediate visual feedback while the debounced
  // reload is in flight.
  const [yearFrom, setYearFrom] = useState<number | null>(
    queryString.projetsYearFrom ? Number(queryString.projetsYearFrom) : null
  )
  const [yearTo, setYearTo] = useState<number | null>(
    queryString.projetsYearTo ? Number(queryString.projetsYearTo) : null
  )

  const handleSearch = useCallback(
    debounce((e: ChangeEvent<HTMLInputElement>) => {
      router.reload({
        only: ['projets', 'meta', 'queryString', 'statusCounts'],
        data: { projetsRecherche: e.target.value, projetsPage: '1' },
        replace: true,
      })
    }, 300),
    []
  )

  const handleTabChange = useCallback((tab: string) => {
    setSelectedTab(tab)
    setYearFrom(null)
    setYearTo(null)
    router.reload({
      only: ['projets', 'meta', 'queryString', 'statusCounts'],
      data: {
        projetsStatut: tab,
        projetsTypesActionExclus: '',
        projetsStatutsExclus: '',
        projetsYearFrom: '',
        projetsYearTo: '',
        projetsPage: '1',
      },
      replace: true,
    })
  }, [])

  const handleTypeToggle = useCallback(
    (type: string) => {
      const current = queryString.projetsTypesActionExclus
        ? queryString.projetsTypesActionExclus.split(',')
        : []
      const next = current.includes(type) ? current.filter((t) => t !== type) : [...current, type]
      router.reload({
        only: ['projets', 'meta', 'queryString', 'statusCounts'],
        data: { projetsTypesActionExclus: next.join(','), projetsPage: '1' },
        replace: true,
      })
    },
    [queryString.projetsTypesActionExclus]
  )

  const handleStatutToggle = useCallback(
    (statut: string) => {
      const current = queryString.projetsStatutsExclus
        ? queryString.projetsStatutsExclus.split(',')
        : []
      const next = current.includes(statut)
        ? current.filter((s) => s !== statut)
        : [...current, statut]
      router.reload({
        only: ['projets', 'meta', 'queryString', 'statusCounts'],
        data: { projetsStatutsExclus: next.join(','), projetsPage: '1' },
        replace: true,
      })
    },
    [queryString.projetsStatutsExclus]
  )

  const handleYearFromChange = useCallback(
    debounce((value: number) => {
      router.reload({
        only: ['projets', 'meta', 'queryString', 'statusCounts'],
        data: { projetsYearFrom: String(value), projetsPage: '1' },
        replace: true,
      })
    }, 300),
    []
  )

  const handleYearToChange = useCallback(
    debounce((value: number) => {
      router.reload({
        only: ['projets', 'meta', 'queryString', 'statusCounts'],
        data: { projetsYearTo: String(value), projetsPage: '1' },
        replace: true,
      })
    }, 300),
    []
  )

  const projetStatuts = {
    to_be_started: {
      label: 'À démarrer',
      count: statusCounts.to_be_started,
      iconId: 'fr-icon-flag-line',
    },
    current: { label: 'En cours', count: statusCounts.current, iconId: 'fr-icon-play-line' },
    completed: {
      label: 'Terminé',
      count: statusCounts.completed,
      iconId: 'fr-icon-calendar-check-line',
    },
    abandoned: {
      label: 'Abandonné',
      count: statusCounts.abandoned,
      iconId: 'fr-icon-error-line',
    },
  }

  const totalFilteredCount =
    statusCounts.to_be_started +
    statusCounts.current +
    statusCounts.completed +
    statusCounts.abandoned

  const TABS = [
    {
      label: `Tous (${totalFilteredCount})`,
      tabId: 'all',
    },
    {
      label: `À démarrer (${statusCounts.to_be_started})`,
      tabId: 'to_be_started',
      disabled: statusCounts.to_be_started === 0,
    },
    {
      label: `En cours (${statusCounts.current})`,
      tabId: 'current',
      disabled: statusCounts.current === 0,
    },
    {
      label: `Terminés (${statusCounts.completed})`,
      tabId: 'completed',
      disabled: statusCounts.completed === 0,
    },
    {
      label: `Abandonnés (${statusCounts.abandoned})`,
      tabId: 'abandoned',
      disabled: statusCounts.abandoned === 0,
    },
  ]

  const effectiveYearFrom = yearFrom ?? availableYearRange.min
  const effectiveYearTo = yearTo ?? availableYearRange.max
  const showYearRange = availableYearRange.max > availableYearRange.min

  return (
    <div>
      <Tabs
        selectedTabId={selectedTab}
        tabs={TABS}
        onTabChange={(tab) => {
          handleTabChange(tab)
        }}
      >
        <SearchWithFilters
          searchPlaceholder="Rechercher un projet"
          onSearchChange={handleSearch}
          defaultSearchValue={queryString?.projetsRecherche || ''}
        >
          <div className="flex flex-col gap-4">
            <div>
              <p className="fr-text--sm fr-mb-1w">
                <strong>Types d'actions</strong>
              </p>
              <div className="flex flex-wrap gap-1">
                {availableActionTypes.map((type) => (
                  <Tag
                    key={type}
                    small
                    pressed={!deselectedTypesAction.has(type)}
                    nativeButtonProps={{
                      onClick: () => handleTypeToggle(type),
                      style: { opacity: deselectedTypesAction.has(type) ? 0.4 : 1 },
                    }}
                  >
                    {type || "Type d'action non renseigné"}
                  </Tag>
                ))}
              </div>
            </div>

            {selectedTab === 'all' && (
              <div>
                <p className="fr-text--sm fr-mb-1w">
                  <strong>Statuts</strong>
                </p>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(projetStatuts).map(([key, value]) => (
                    <Tag
                      key={key}
                      small
                      pressed={!deselectedStatuts.has(key)}
                      nativeButtonProps={{
                        onClick: () => handleStatutToggle(key),
                        style: { opacity: deselectedStatuts.has(key) ? 0.4 : 1 },
                      }}
                    >
                      {value.label}
                    </Tag>
                  ))}
                </div>
              </div>
            )}

            {showYearRange && (
              <Range
                double
                small
                label=""
                min={availableYearRange.min}
                max={availableYearRange.max}
                nativeInputProps={[
                  {
                    'aria-label': 'Année de début',
                    'value': effectiveYearFrom,
                    'onChange': (e) => {
                      const val = Number(e.target.value)
                      setYearFrom(val)
                      handleYearFromChange(val)
                    },
                  },
                  {
                    'aria-label': 'Année de fin',
                    'value': effectiveYearTo,
                    'onChange': (e) => {
                      const val = Number(e.target.value)
                      setYearTo(val)
                      handleYearToChange(val)
                    },
                  },
                ]}
              />
            )}
          </div>
        </SearchWithFilters>

        <div className="fr-mt-2w">
          {projets.length > 0 ? (
            <ProjetsList {...{ projets }} projetStatuts={projetStatuts} />
          ) : (
            <EmptyPlaceholder
              illustrativeIcon="fr-icon-briefcase-line"
              label="Aucun projet ne correspond à ces critères"
            />
          )}
        </div>

        {meta.lastPage > 1 && (
          <div className="fr-mt-4w flex justify-center">
            <Pagination
              count={meta.lastPage}
              defaultPage={meta.currentPage}
              getPageLinkProps={(pageNumber) => {
                const params = new URLSearchParams(queryString)
                params.set('projetsPage', String(pageNumber))
                return { href: `?${params.toString()}` }
              }}
            />
          </div>
        )}
      </Tabs>
    </div>
  )
}
