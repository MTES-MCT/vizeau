import { Head } from '@inertiajs/react'
import { InferPageProps } from '@adonisjs/inertia/types'
import { fr } from '@codegouvfr/react-dsfr'
import { Pagination } from '@codegouvfr/react-dsfr/Pagination'
import LocationFrance from '@codegouvfr/react-dsfr/picto/LocationFrance'
import AacController from '#controllers/aac_controller'
import { formatDateFr } from '~/functions/date'
import AacsSearch from '~/components/aacs/aacs-search'
import Layout from '~/ui/layouts/layout'
import EmptyPlaceholder from '~/ui/EmptyPlaceholder'
import ListItem from '~/ui/ListItem'

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

      <div className="fr-container flex flex-col gap-4 fr-mt-4w fr-mb-8w">
        <AacsSearch queryString={queryString} reloadOnly={['aacs', 'meta', 'queryString']} />

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
          <>
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
            {meta.lastPage > 1 && (
              <div className="fr-mt-4w flex justify-center">
                <Pagination
                  count={meta.lastPage}
                  defaultPage={meta.currentPage}
                  getPageLinkProps={(pageNumber) => {
                    const params = new URLSearchParams(queryString)
                    params.set('aacPage', String(pageNumber))
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
