import { ReactNode, useState } from 'react'

import { SearchBar } from '@codegouvfr/react-dsfr/SearchBar'
import Button from '@codegouvfr/react-dsfr/Button'
import SmallSection from '~/ui/SmallSection'

export type SearchWithFiltersProps = {
  searchPlaceholder?: string
  onSearchChange: (value: string) => void
  defaultSearchValue?: string
  children?: ReactNode
}

export default function SearchWithFilters({
  searchPlaceholder = 'Rechercher',
  onSearchChange,
  defaultSearchValue = '',
  children,
}: SearchWithFiltersProps) {
  const [showFilters, setShowFilters] = useState(false)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-end gap-2">
        <SearchBar
          className="flex flex-1"
          renderInput={({ className, id, type }) => (
            <input
              className={className}
              id={id}
              placeholder={searchPlaceholder}
              type={type}
              onChange={(e) => onSearchChange(e.currentTarget.value)}
              defaultValue={defaultSearchValue}
            />
          )}
        />
        {children && (
          <Button
            title="Affichage des filtres"
            iconId="fr-icon-filter-line"
            priority={showFilters ? 'primary' : 'secondary'}
            onClick={() => setShowFilters(!showFilters)}
          />
        )}
      </div>

      {children && (
        <div className={showFilters ? undefined : 'hidden'}>
          <SmallSection priority="secondary" title="Filtres" iconId="fr-icon-filter-line" hasBorder>
            {children}
          </SmallSection>
        </div>
      )}
    </div>
  )
}
