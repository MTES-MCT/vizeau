import React from 'react'
import { Pagination, addPaginationTranslations } from '@codegouvfr/react-dsfr/Pagination'
import LocationFrance from '@codegouvfr/react-dsfr/picto/LocationFrance'
import { router } from '@inertiajs/react'
import type { AacSummaryJson } from '../../../types/models'
import EmptyPlaceholder from '~/ui/EmptyPlaceholder'
import ListItem from '~/ui/ListItem'
import { formatDateFr } from '~/functions/date'
import { fr } from '@codegouvfr/react-dsfr'
import AacsSearch from './aacs-search'

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
  return (
    <div>
      <div className="fr-p-1w">
        <div className="flex flex-col gap-5">
          <AacsSearch
            queryString={queryString}
            reloadOnly={['aacs', 'aacMeta', 'aacQueryString']}
          />

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
                {`aire${meta.total > 1 ? 's' : ''} d'alimentation de captage`}
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
