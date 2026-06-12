import { Head } from '@inertiajs/react'
import { InferPageProps } from '@adonisjs/inertia/types'
import TerritoiresController from '#controllers/territoires_controller'
import { fr } from '@codegouvfr/react-dsfr'
import LocationFrance from '@codegouvfr/react-dsfr/picto/LocationFrance'
import Layout from '~/ui/layouts/layout'
import EmptyPlaceholder from '~/ui/EmptyPlaceholder'
import { Pagination } from '@codegouvfr/react-dsfr/Pagination'
import ListItem from '~/ui/ListItem'
import type { TerritoireJson } from '#types/models'

export default function TerritoiresIndex({
  territoires,
  meta,
}: InferPageProps<TerritoiresController, 'index'>) {
  return (
    <Layout>
      <Head title="Mes territoires" />
      <div
        className="fr-p-2w"
        style={{ backgroundColor: fr.colors.decisions.background.alt.blueFrance.default }}
      >
        <div className="fr-container">
          <div className="fr-h6 fr-mb-0">Territoires associés à votre compte</div>
        </div>
      </div>

      <div className="fr-container flex flex-col gap-4 fr-mt-4w fr-mb-8w">
        {territoires.length === 0 ? (
          <EmptyPlaceholder
            label="Aucun territoire associé à votre compte"
            pictogram={LocationFrance}
          />
        ) : (
          <>
            <div className="flex flex-col gap-2">
              {territoires.map((territoire: TerritoireJson, index: number) => {
                return (
                  <ListItem
                    key={territoire.code}
                    title={territoire.nom}
                    linkProps={territoire.aacHref ? { href: territoire.aacHref } : undefined}
                    priority={index % 2 === 0 ? 'primary' : 'secondary'}
                    metas={[
                      {
                        content: territoire.code
                          ? `Code SANDRE : ${territoire.code}`
                          : 'Territoire non identifié au SANDRE',
                        iconId: territoire.code ? 'fr-icon-hashtag' : 'fr-icon-error-warning-line',
                      },
                      ...(territoire.surface
                        ? [
                            {
                              content: `${Math.round(territoire.surface)} ha`,
                              iconId: 'fr-icon-ruler-line',
                            },
                          ]
                        : []),
                      ...(territoire.nb_captages_actifs
                        ? [
                            {
                              content: `${territoire.nb_captages_actifs} captage${territoire.nb_captages_actifs > 1 ? 's' : ''} actif${territoire.nb_captages_actifs > 1 ? 's' : ''}`,
                              iconId: 'fr-icon-water-line',
                            },
                          ]
                        : []),
                      ...(territoire.nb_communes
                        ? [
                            {
                              content: `${territoire.nb_communes} commune${territoire.nb_communes > 1 ? 's' : ''}`,
                              iconId: 'fr-icon-government-line',
                            },
                          ]
                        : []),
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
                  getPageLinkProps={(pageNumber) => ({
                    href: `?territoiresPage=${pageNumber}`,
                  })}
                />
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}
