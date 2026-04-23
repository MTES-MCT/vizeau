import { ChangeEvent, useMemo, useState } from 'react'
import { router } from '@inertiajs/react'

import { ProjetStatutJson, ProjetJson } from '../../../types/models'
import { countBy, debounce, uniq } from 'lodash-es'

import { Tabs } from '@codegouvfr/react-dsfr/Tabs'
import Tag from '@codegouvfr/react-dsfr/Tag'
import { Range } from '@codegouvfr/react-dsfr/Range'
import SearchWithFilters from '~/ui/SearchWithFilters'
import ProjetsList from './projets-list'

export type ProjetEtape = {
  title: string
  note: string | null
  date: string
  date_maj: string
  documents: unknown[]
  tags: string[]
  is_validated: boolean
}

export type ProjetStatut = ProjetStatutJson

export type ProjetsTabsProps = {
  projets: ProjetJson[]
  queryString: any
}

export default function ProjetsTabs({ projets, queryString }: ProjetsTabsProps) {
  const [selectedTab, setSelectedTab] = useState('all')
  const [deselectedTypesAction, setDeselectedTypesAction] = useState<Set<string>>(new Set())
  const [deselectedStatuts, setDeselectedStatuts] = useState<Set<string>>(new Set())
  const [yearFrom, setYearFrom] = useState<number | null>(null)
  const [yearTo, setYearTo] = useState<number | null>(null)

  const typesAction = useMemo(() => uniq(projets.map((p) => p.type_action)).sort(), [projets])

  const years = useMemo(
    () => uniq(projets.map((p) => new Date(p.created_at).getFullYear())).sort((a, b) => a - b),
    [projets]
  )

  const minAvailableYear = years[0] ?? new Date().getFullYear()
  const maxAvailableYear = years[years.length - 1] ?? new Date().getFullYear()

  const toggle = (setter: React.Dispatch<React.SetStateAction<Set<string>>>, value: string) => {
    setter((prev) => {
      const next = new Set(prev)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return next
    })
  }

  const handleSearch = debounce((e: ChangeEvent<HTMLInputElement>) => {
    /*
      We refresh the projets with the new search query,
      the query string so that the pagination doesn't break,
      and we reset the page to 1.
     */
    router.reload({
      only: ['projetsWithPagination', 'queryString'],
      data: { recherche: e.target.value, page: 1 },
      replace: true,
    })
  }, 300)

  const statutCounts = countBy(projets, 'statut')

  const projetStatuts = {
    to_be_started: {
      label: 'À démarrer',
      count: statutCounts.to_be_started ?? 0,
      iconId: 'fr-icon-flag-line',
    },
    current: { label: 'En cours', count: statutCounts.current ?? 0, iconId: 'fr-icon-play-line' },
    completed: {
      label: 'Terminés',
      count: statutCounts.completed ?? 0,
      iconId: 'fr-icon-calendar-check-line',
    },
    abandoned: {
      label: 'Abandonnés',
      count: statutCounts.abandoned ?? 0,
      iconId: 'fr-icon-error-line',
    },
  }

  const selectedProjetsList = useMemo(() => {
    const effectiveYearFrom = yearFrom ?? minAvailableYear
    const effectiveYearTo = yearTo ?? maxAvailableYear
    return projets.filter((projet) => {
      if (selectedTab !== 'all' && projet.statut !== selectedTab) return false
      if (deselectedTypesAction.has(projet.type_action)) return false
      if (deselectedStatuts.has(projet.statut)) return false
      const year = new Date(projet.created_at).getFullYear()
      if (year < effectiveYearFrom || year > effectiveYearTo) return false
      return true
    })
  }, [
    projets,
    selectedTab,
    deselectedTypesAction,
    deselectedStatuts,
    yearFrom,
    yearTo,
    minAvailableYear,
    maxAvailableYear,
  ])

  const TABS = [
    {
      label: `Tous (${projets.length})`,
      tabId: 'all',
    },
    {
      label: `À démarrer (${projetStatuts.to_be_started.count})`,
      tabId: 'to_be_started',
      disabled: projetStatuts.to_be_started.count === 0,
    },
    {
      label: `En cours (${projetStatuts.current.count})`,
      tabId: 'current',
      disabled: projetStatuts.current.count === 0,
    },
    {
      label: `Terminés (${projetStatuts.completed.count})`,
      tabId: 'completed',
      disabled: projetStatuts.completed.count === 0,
    },
    {
      label: `Abandonnés (${projetStatuts.abandoned.count})`,
      tabId: 'abandoned',
      disabled: projetStatuts.abandoned.count === 0,
    },
  ]
  return (
    <div>
      <Tabs
        selectedTabId={selectedTab}
        tabs={TABS}
        onTabChange={(tab) => {
          setSelectedTab(tab)
          setDeselectedTypesAction(new Set())
          setDeselectedStatuts(new Set())
          setYearFrom(null)
          setYearTo(null)
        }}
      >
        <SearchWithFilters
          searchPlaceholder="Rechercher un projet"
          onSearchChange={handleSearch}
          defaultSearchValue={queryString?.recherche || ''}
        >
          <div className="flex flex-col gap-4">
            <div>
              <p className="fr-text--sm fr-mb-1w">
                <strong>Types d'actions</strong>
              </p>
              <div className="flex flex-wrap gap-1">
                {typesAction.map((type) => (
                  <Tag
                    key={type}
                    small
                    pressed={!deselectedTypesAction.has(type)}
                    nativeButtonProps={{
                      onClick: () => toggle(setDeselectedTypesAction, type),
                      style: { opacity: deselectedTypesAction.has(type) ? 0.4 : 1 },
                    }}
                  >
                    {type}
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
                        onClick: () => toggle(setDeselectedStatuts, key),
                        style: { opacity: deselectedStatuts.has(key) ? 0.4 : 1 },
                      }}
                    >
                      {value.label}
                    </Tag>
                  ))}
                </div>
              </div>
            )}

            {years.length > 1 && (
              <Range
                double
                small
                label=""
                min={minAvailableYear}
                max={maxAvailableYear}
                nativeInputProps={[
                  {
                    value: yearFrom ?? minAvailableYear,
                    onChange: (e) => setYearFrom(Number(e.target.value)),
                  },
                  {
                    value: yearTo ?? maxAvailableYear,
                    onChange: (e) => setYearTo(Number(e.target.value)),
                  },
                ]}
              />
            )}
          </div>
        </SearchWithFilters>

        <div className="fr-mt-2w">
          <ProjetsList {...{ projets: selectedProjetsList }} projetStatuts={projetStatuts} />
        </div>
      </Tabs>
    </div>
  )
}
