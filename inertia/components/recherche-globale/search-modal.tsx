import { useEffect, useId, useRef, useState } from 'react'
import { router } from '@inertiajs/react'
import { fr } from '@codegouvfr/react-dsfr'
import { createModal } from '@codegouvfr/react-dsfr/Modal'
import { useIsModalOpen } from '@codegouvfr/react-dsfr/Modal/useIsModalOpen'
import { SearchBar } from '@codegouvfr/react-dsfr/SearchBar'
import { TagsGroup } from '@codegouvfr/react-dsfr/TagsGroup'
import type { GlobalSearchCategory, GlobalSearchGroupJson } from '#types/recherche'
import { useGlobalSearch } from '~/hooks/use_global_search'
import SearchFirstUse from './search-first-use'
import SearchResults from './search-results'
import { CATEGORY_BY_ID } from './search_categories'

export const searchModal = createModal({
  id: 'header-search-modal',
  isOpenedByDefault: false,
})

const TITLE = 'Rechercher dans Viz’eau'

function getStatusMessage({
  query,
  loading,
  error,
  total,
  hasGroups,
}: {
  query: string
  loading: boolean
  error: string | null
  total: number
  hasGroups: boolean
}) {
  if (error) return error
  if (loading && !hasGroups) return 'Recherche en cours…'
  if (total > 0) return `${total} résultat${total > 1 ? 's' : ''} pour « ${query} »`
  if (!loading) {
    return `Aucun résultat pour « ${query} ». Vérifiez l’orthographe ou essayez un code SANDRE ou BSS.`
  }
  return ''
}

export default function SearchModal() {
  const inputRef = useRef<HTMLInputElement>(null)
  const listboxId = useId()
  const titleId = `${searchModal.id}-title`

  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<GlobalSearchCategory | 'all'>('all')
  const [activeIndex, setActiveIndex] = useState(0)

  const { trimmedQuery, hasQuery, groups, loading, error } = useGlobalSearch(query)

  useIsModalOpen(searchModal, {
    // Le DSFR donne le focus au bouton « Fermer » dès que la modale devient visible : on retente
    // à chaque frame jusqu'à ce que le champ l'obtienne (tant qu'elle est masquée, focus() est sans effet).
    onDisclose: () => {
      let attempts = 0
      const focusInput = () => {
        const input = inputRef.current
        if (!input || document.activeElement === input || attempts++ > 30) return
        input.focus()
        requestAnimationFrame(focusInput)
      }
      requestAnimationFrame(focusInput)
    },
    onConceal: () => {
      setQuery('')
      setFilter('all')
      setActiveIndex(0)
    },
  })

  // Chaque nouvelle recherche repart du premier résultat
  useEffect(() => setActiveIndex(0), [groups])

  const nonEmptyGroups = groups.filter((group) => group.items.length > 0)
  const total = nonEmptyGroups.reduce((sum, group) => sum + group.total, 0)

  // Si le filtre actif n'a plus de résultats après une nouvelle recherche, on revient à « Tout »
  const activeFilter = nonEmptyGroups.some((group) => group.category === filter) ? filter : 'all'
  const visibleGroups =
    activeFilter === 'all'
      ? nonEmptyGroups
      : nonEmptyGroups.filter((group) => group.category === activeFilter)
  const flatItems = visibleGroups.flatMap((group) => group.items)

  const getOptionId = (
    group: GlobalSearchGroupJson,
    item: GlobalSearchGroupJson['items'][number]
  ) => `${listboxId}-${group.category}-${item.id}`
  const activeGroup = visibleGroups.find((group) => group.items.includes(flatItems[activeIndex]))
  const activeOptionId =
    activeGroup && flatItems[activeIndex]
      ? getOptionId(activeGroup, flatItems[activeIndex])
      : undefined

  // Garde l'option active visible pendant la navigation au clavier
  useEffect(() => {
    if (activeOptionId) {
      document.getElementById(activeOptionId)?.scrollIntoView({ block: 'nearest' })
    }
  }, [activeOptionId])

  const selectIndex = (index: number) => {
    const item = flatItems[index]
    if (!item) return
    searchModal.close()
    router.visit(item.href)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      selectIndex(activeIndex)
    } else if (event.key === 'ArrowDown' && flatItems.length > 0) {
      event.preventDefault()
      setActiveIndex((index) => Math.min(index + 1, flatItems.length - 1))
    } else if (event.key === 'ArrowUp' && flatItems.length > 0) {
      event.preventDefault()
      setActiveIndex((index) => Math.max(index - 1, 0))
    }
  }

  const pickFilter = (value: GlobalSearchCategory | 'all') => {
    setFilter(value)
    setActiveIndex(0)
    inputRef.current?.focus()
  }

  return (
    <searchModal.Component title={TITLE} size="large" className="[&_.fr-modal\_\_body]:h-[900px]">
      <div className="flex flex-col gap-4 fr-mb-3w">
        <SearchBar
          label="Rechercher"
          onButtonClick={() => selectIndex(activeIndex)}
          renderInput={({ className, id, type }) => (
            <input
              ref={inputRef}
              className={`${className}`}
              id={id}
              type={type}
              placeholder="Exploitation, AAC, point de prélèvement, projet…"
              autoComplete="off"
              spellCheck={false}
              maxLength={100}
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={flatItems.length > 0}
              aria-controls={flatItems.length > 0 ? listboxId : undefined}
              aria-activedescendant={activeOptionId}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleKeyDown}
            />
          )}
        />

        {hasQuery && (
          <div className="flex flex-col gap-3">
            <p
              className="fr-text--sm fr-mb-0"
              style={{
                color: error
                  ? fr.colors.decisions.text.default.error.default
                  : fr.colors.decisions.text.mention.grey.default,
              }}
              aria-live="polite"
              aria-busy={loading}
            >
              {getStatusMessage({
                query: trimmedQuery,
                loading,
                error,
                total,
                hasGroups: nonEmptyGroups.length > 0,
              })}
            </p>

            {nonEmptyGroups.length > 1 && (
              <TagsGroup
                smallTags
                className="fr-mb-0"
                tags={[
                  {
                    children: `Tout (${total})`,
                    pressed: activeFilter === 'all',
                    onClick: () => pickFilter('all'),
                  },
                  ...nonEmptyGroups.map((group) => ({
                    children: `${CATEGORY_BY_ID[group.category].label} (${group.total})`,
                    pressed: activeFilter === group.category,
                    onClick: () => pickFilter(group.category),
                  })),
                ]}
              />
            )}
          </div>
        )}
      </div>

      {!hasQuery && <SearchFirstUse />}

      {hasQuery && visibleGroups.length > 0 && (
        <SearchResults
          id={listboxId}
          labelledBy={titleId}
          groups={visibleGroups}
          query={trimmedQuery}
          activeOptionId={activeOptionId}
          getOptionId={getOptionId}
          onHover={setActiveIndex}
          onSelect={selectIndex}
        />
      )}
    </searchModal.Component>
  )
}
