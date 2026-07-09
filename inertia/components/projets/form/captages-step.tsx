import { usePage, router } from '@inertiajs/react'
import { debounce } from 'lodash-es'

import { Pagination, addPaginationTranslations } from '@codegouvfr/react-dsfr/Pagination'
import { Checkbox } from '@codegouvfr/react-dsfr/Checkbox'
import SearchWithFilters from '~/ui/SearchWithFilters'
import CheckboxCard from '~/ui/CheckboxCard'
import { stringToColor } from '~/functions/colors'
import type { ProjetFormData } from './projet-form'

const handleSearch = debounce((value: string) => {
  const params = new URLSearchParams(window.location.search)
  const showActifOnly = params.get('showActifOnly') ?? '0'

  router.reload({
    only: ['installations', 'installationsMeta', 'installationsQueryString'],
    data: { installationsRecherche: value.trim(), installationsPage: 1, showActifOnly },
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

export type CaptagesStepProps = {
  data: ProjetFormData
  setData: React.Dispatch<React.SetStateAction<ProjetFormData>>
}

export default function CaptagesStep({ data, setData }: CaptagesStepProps) {
  const page = usePage<InferPageProps<ProjectsController, 'create'>>()
  const { installations, installationsMeta, installationsQueryString } = page.props
  const currentStepParam = new URLSearchParams(page.url.split('?')[1] || '').get('step') || '1'

  const showActifOnly = installationsQueryString.showActifOnly === '1'

  const handleShowActifOnlyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    router.reload({
      only: ['installations', 'installationsMeta', 'installationsQueryString'],
      data: {
        showActifOnly: e.target.checked ? '1' : '0',
        installationsPage: 1,
        installationsRecherche: installationsQueryString.installationsRecherche ?? '',
      },
      replace: true,
    })
  }

  const selectedCaptages = new Set(data.captages || [])

  const handleToggle = (code: string) => {
    setData((prev) => {
      const current = prev.captages || []
      const updated = current.includes(code)
        ? current.filter((c) => c !== code)
        : [...current, code]
      return { ...prev, captages: updated }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <SearchWithFilters
        searchPlaceholder="Rechercher une installation"
        onSearchChange={(e) => handleSearch(e.target.value)}
        defaultSearchValue={installationsQueryString.installationsRecherche ?? ''}
      >
        <Checkbox
          small
          options={[
            {
              label: 'Afficher uniquement les points de captage actifs',
              nativeInputProps: {
                name: 'showActifOnly',
                onChange: handleShowActifOnlyChange,
                checked: showActifOnly,
              },
            },
          ]}
        />
      </SearchWithFilters>

      {installations.length === 0 ? (
        <p>Aucune installation trouvée.</p>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {installations.map((installation) => (
              <CheckboxCard
                key={installation.code}
                value={installation.code}
                title={installation.nom}
                metas={[
                  { iconId: 'fr-icon-government-line', content: installation.commune },
                  ...(installation.etat === 'ACTIF'
                    ? [{ iconId: 'fr-icon-checkbox-fill', content: installation.etat }]
                    : []),
                ]}
                isSelected={selectedCaptages.has(installation.code)}
                onCheck={() => handleToggle(installation.code)}
                tags={[
                  ...(installation.prioritaire === true
                    ? [{ label: 'Prioritaire', iconId: 'fr-icon-info-fill' }]
                    : []),
                  ...(installation.type
                    ? [{ label: installation.type, color: stringToColor(installation.type) }]
                    : []),
                ]}
              />
            ))}
          </div>

          {installationsMeta.lastPage > 1 && (
            <div className="fr-mt-4w flex justify-center">
              <Pagination
                count={installationsMeta.lastPage}
                defaultPage={installationsMeta.currentPage}
                getPageLinkProps={(pageNumber) => {
                  const params = new URLSearchParams(installationsQueryString)
                  params.set('step', currentStepParam)
                  params.set('installationsPage', String(pageNumber))
                  params.set('showActifOnly', showActifOnly ? '1' : '0')
                  return {
                    href: `/projets/creation?${params.toString()}`,
                    onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
                      e.preventDefault()
                      router.visit(`/projets/creation?${params.toString()}`, {
                        preserveState: true,
                        preserveScroll: true,
                        only: ['installations', 'installationsMeta', 'installationsQueryString'],
                      })
                    },
                  }
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}
