import { Head } from '@inertiajs/react'
import { fr } from '@codegouvfr/react-dsfr'
import { Pagination } from '@codegouvfr/react-dsfr/Pagination'
import { Badge } from '@codegouvfr/react-dsfr/Badge'
import { InferPageProps } from '@adonisjs/inertia/types'
import Layout from '~/ui/layouts/layout'
import AacController from '#controllers/aac_controller'
import EmptyPlaceholder from '~/ui/EmptyPlaceholder'
import AacsSearch from '~/components/aacs/aacs-search'

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
        </div>
      </div>

      <div className="fr-container fr-mt-4w fr-mb-8w">
        <AacsSearch queryString={queryString} />

        {aacs.length === 0 ? (
          <EmptyPlaceholder
            label="Aucune AAC à afficher"
            illustrativeIcon="fr-icon-earth-europe-fill"
          />
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
