import { ChangeEvent } from 'react'
import { Head, router } from '@inertiajs/react'
import { fr } from '@codegouvfr/react-dsfr'
import { SearchBar } from '@codegouvfr/react-dsfr/SearchBar'
import { Pagination } from '@codegouvfr/react-dsfr/Pagination'
import { Badge } from '@codegouvfr/react-dsfr/Badge'
import { InferPageProps } from '@adonisjs/inertia/types'
import { debounce } from 'lodash-es'
import Layout from '~/ui/layouts/layout'
import AacController from '#controllers/aac_controller'

const handleSearch = debounce((field: string, value: string) => {
  router.reload({
    only: ['aacs', 'meta', 'queryString'],
    data: { [field]: value, page: 1 },
    replace: true,
  })
}, 300)

export default function AacIndex({
  aacs,
  meta,
  queryString,
}: InferPageProps<AacController, 'index'>) {
  return (
    <Layout>
      <Head title="Aires d'Alimentation de Captage" />
      <div
        className="fr-p-2w"
        style={{ backgroundColor: fr.colors.decisions.background.alt.blueFrance.default }}
      >
        <div className="fr-container">
          <div className="fr-h6 fr-mb-0">Aires d'Alimentation de Captage (AAC)</div>
          <p className="fr-text--sm fr-mb-0 text-gray-600">{meta.total} AAC au total</p>
        </div>
      </div>

      <div className="fr-container fr-mt-4w fr-mb-8w">
        <div className="flex gap-4 fr-mb-4w">
          <SearchBar
            className="flex-1"
            renderInput={({ className, id, type }) => (
              <input
                className={className}
                id={id}
                type={type}
                placeholder="Rechercher par code ou nom d'AAC"
                defaultValue={queryString?.recherche || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  handleSearch('recherche', e.target.value)
                }
              />
            )}
          />
          <SearchBar
            className="flex-1"
            renderInput={({ className, id, type }) => (
              <input
                className={className}
                id={id}
                type={type}
                placeholder="Filtrer par commune"
                defaultValue={queryString?.commune || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  handleSearch('commune', e.target.value)
                }
              />
            )}
          />
        </div>

        {aacs.length === 0 ? (
          <div className="fr-p-4w text-center text-gray-500">Aucune AAC trouvée.</div>
        ) : (
          <>
            <div className="fr-table fr-table--bordered">
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Nom</th>
                    <th>Surface (ha)</th>
                    <th>Captages actifs</th>
                    <th>Communes</th>
                  </tr>
                </thead>
                <tbody>
                  {aacs.map((aac) => (
                    <tr key={aac.code}>
                      <td>
                        <Badge severity="info" small>
                          {aac.code}
                        </Badge>
                      </td>
                      <td>
                        <a href={`/aac/${aac.code}`} className="fr-link">
                          {aac.nom}
                        </a>
                      </td>
                      <td>{aac.surface?.toLocaleString('fr-FR')}</td>
                      <td>{aac.nb_captages_actifs}</td>
                      <td>{aac.nb_communes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {meta.lastPage > 1 && (
              <div className="fr-mt-4w flex justify-center">
                <Pagination
                  count={meta.lastPage}
                  defaultPage={meta.currentPage}
                  getPageLinkProps={(pageNumber) => {
                    const params = new URLSearchParams(queryString)
                    params.set('page', String(pageNumber))
                    return { href: `?${params.toString()}` }
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}
