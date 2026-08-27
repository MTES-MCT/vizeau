import { Head } from '@inertiajs/react'
import { fr } from '@codegouvfr/react-dsfr'
import LocationFrance from '@codegouvfr/react-dsfr/picto/LocationFrance'
import Layout from '~/ui/layouts/layout'
import EmptyPlaceholder from '~/ui/EmptyPlaceholder'
import { CallOut } from '@codegouvfr/react-dsfr/CallOut'
import { Pagination } from '@codegouvfr/react-dsfr/Pagination'
import ListItem from '~/ui/ListItem'
import type { TerritoireJson } from '#types/models'
import Alert from '@codegouvfr/react-dsfr/Alert'

export default function TerritoiresIndex({ territoires, meta }: any) {
  return (
    <Layout>
      <Head title="Qualité de l'eau et d'assolement de mes territoires suivis" />
      <div
        className="fr-p-2w"
        style={{ backgroundColor: fr.colors.decisions.background.alt.blueFrance.default }}
      >
        <div className="fr-container">
          <div className="fr-h6 fr-mb-0">
            Qualité de l'eau et d'assolement de mes territoires suivis
          </div>
        </div>
      </div>

      <div className="fr-container flex flex-col gap-4 fr-mt-4w fr-mb-8w">
        <div className="flex flex-col fr-mb-5w">
          <CallOut
            iconId="fr-icon-drop-line"
            title="Accédez aux données qualité de l'eau et assolement"
          >
            Pour consulter la qualité de l'eau et les données d'assolement d'un territoire,
            sélectionnez en priorité un territoire dans la liste ci-dessous. Vous accéderez alors
            aux analyses et visualisations disponibles pour ce territoire, qui peuvent également
            être partagés entre animateurs.
          </CallOut>
          <Alert
            description="Cette page regroupe les territoires auxquels vous êtes rattaché en tant qu'animateur. Vous pouvez y consulter les informations et accéder aux fonctionnalités disponibles pour les territoires dont vous assurez le suivi."
            severity="info"
            small
          />
        </div>
        {territoires.length === 0 ? (
          <EmptyPlaceholder
            label="Aucun territoire associé à votre compte"
            pictogram={LocationFrance}
          />
        ) : (
          <>
            <h3 className="fr-text--lg fr-mb-0">
              Sélectionnez un territoire pour accéder aux données
            </h3>
            <div className="flex flex-col gap-2">
              {territoires.map((territoire: TerritoireJson, index: number) => {
                return (
                  <ListItem
                    key={territoire.id}
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
                              iconId: 'fr-icon-drop-line',
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
