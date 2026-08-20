import { Head } from '@inertiajs/react'

import { fr } from '@codegouvfr/react-dsfr'
import { Pagination } from '@codegouvfr/react-dsfr/Pagination'
import LocationFrance from '@codegouvfr/react-dsfr/picto/LocationFrance'
import { formatDateFr } from '~/functions/date'
import AacsSearch from '~/components/aacs/aacs-search'
import Layout from '~/ui/layouts/layout'
import EmptyPlaceholder from '~/ui/EmptyPlaceholder'
import ListItem from '~/ui/ListItem'
import { CallOut } from '@codegouvfr/react-dsfr/CallOut'
import type { AacSummaryJson } from '#types/models'

export default function AacIndex({ aacs, meta, queryString }: any) {
  return (
    <Layout>
      <Head title="Qualité de l'eau et d'assolement des Aires d’Alimentation de Captage (AAC)" />
      <div
        className="fr-p-2w"
        style={{ backgroundColor: fr.colors.decisions.background.alt.blueFrance.default }}
      >
        <div className="fr-container">
          <div className="fr-h6 fr-mb-0">
            Qualité de l'eau et d'assolement des Aires d’Alimentation de Captage (AAC)
          </div>
        </div>
      </div>

      <div className="fr-container flex flex-col gap-4 fr-mt-4w fr-mb-8w">
        <CallOut
          iconId="fr-icon-drop-line"
          title="Accédez aux données qualité de l'eau et assolement"
          className="fr-mb-5w"
        >
          Cette page référence l'ensemble des Aires d'Alimentation de Captage (AAC) connues par
          l'application.
          <strong style={{ color: fr.colors.decisions.text.actionHigh.blueFrance.default }}>
            Pour consulter la qualité de l'eau et les données d'assolement, sélectionnez en priorité
            une AAC{' '}
          </strong>
          dans la liste ci-dessous. Qu'elles proviennent du référentiel national Sandre ou de
          territoires de travail non référencés (à venir), toutes les AAC sont consultables par tous
          les utilisateurs.
        </CallOut>
        <>
          <h3 className="fr-text--lg fr-mb-0">
            Sélectionnez un territoire pour accéder aux données
          </h3>
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
                {aacs.map((aac: AacSummaryJson, index: number) => {
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
        </>
      </div>
    </Layout>
  )
}
