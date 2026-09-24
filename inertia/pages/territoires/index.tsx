import { Deferred, Head } from '@inertiajs/react'
import { fr } from '@codegouvfr/react-dsfr'
import LocationFrance from '@codegouvfr/react-dsfr/picto/LocationFrance'
import Layout from '~/ui/layouts/layout'
import EmptyPlaceholder from '~/ui/EmptyPlaceholder'
import { CallOut } from '@codegouvfr/react-dsfr/CallOut'
import { Pagination } from '@codegouvfr/react-dsfr/Pagination'

import type { TerritoireJson } from '#types/models'
import Alert from '@codegouvfr/react-dsfr/Alert'
import DepassementsListItem from '~/ui/DepassementsListItem'
import { getAacListItemMetas } from '~/functions/aac'
import Loader from '~/ui/Loader'

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
        <Deferred
          data={['territoires', 'meta']}
          fallback={
            <div className="fr-my-4w">
              <Loader />
            </div>
          }
        >
          <TerritoiresList territoires={territoires} meta={meta} />
        </Deferred>
      </div>
    </Layout>
  )
}

function TerritoiresList({ territoires, meta }: any) {
  return (
    <>
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
                <DepassementsListItem
                  key={territoire.code}
                  title={territoire.nom}
                  priority={index % 2 === 0 ? 'primary' : 'secondary'}
                  linkProps={territoire.code ? { href: `/aac/${territoire.code}` } : undefined}
                  depassementsAlerte={territoire.depassements_alerte}
                  depassementsReglementaires={territoire.depassements_reglementaires}
                  metas={getAacListItemMetas(territoire)}
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
    </>
  )
}
