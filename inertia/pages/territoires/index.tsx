import { Deferred, Head } from '@inertiajs/react'
import { fr } from '@codegouvfr/react-dsfr'
import LocationFrance from '@codegouvfr/react-dsfr/picto/LocationFrance'
import Layout from '~/ui/layouts/Layout'
import EmptyPlaceholder from '~/ui/EmptyPlaceholder'
import { CallOut } from '@codegouvfr/react-dsfr/CallOut'
import { Pagination } from '@codegouvfr/react-dsfr/Pagination'

import type { Data } from '@generated/data'
import Alert from '@codegouvfr/react-dsfr/Alert'
import DepassementsListItem from '~/ui/DepassementsListItem'
import { getAacListItemMetas } from '~/functions/aac'
import Loader from '~/ui/Loader'
import AlertDrawer from '~/ui/AlertDrawer'

export default function TerritoiresIndex({ territoires, territoiresInactifs, meta }: any) {
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
          data={['territoires', 'meta', 'territoiresInactifs']}
          fallback={
            <div className="fr-my-4w">
              <Loader />
            </div>
          }
        >
          <TerritoiresList
            territoires={territoires}
            territoiresInactifs={territoiresInactifs}
            meta={meta}
          />
        </Deferred>
      </div>
    </Layout>
  )
}

type Territoire = Data.Territoire.Variants['forAac']

function TerritoiresList({
  territoires,
  territoiresInactifs,
  meta,
}: {
  territoires: Territoire[]
  territoiresInactifs: Territoire[]
  meta: any
}) {
  if (territoires.length === 0 && territoiresInactifs.length === 0) {
    return (
      <EmptyPlaceholder
        label="Aucun territoire associé à votre compte"
        pictogram={LocationFrance}
      />
    )
  }

  return (
    <>
      {territoires.length > 0 && (
        <>
          <h3 className="fr-text--lg fr-mb-0">
            Sélectionnez un territoire pour accéder aux données
          </h3>
          <div className="flex flex-col gap-2">
            {territoires.map((territoire, index) => (
              <DepassementsListItem
                key={territoire.id}
                title={territoire.name ?? 'Territoire sans nom'}
                priority={index % 2 === 0 ? 'primary' : 'secondary'}
                linkProps={territoire.code ? { href: `/aac/${territoire.code}` } : undefined}
                depassementsAlerte={territoire.depassements_alerte}
                depassementsReglementaires={territoire.depassements_reglementaires}
                metas={getAacListItemMetas(territoire)}
              />
            ))}
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

      {territoiresInactifs.length > 0 && (
        <AlertDrawer
          severity="warning"
          title={
            territoiresInactifs.length > 1
              ? `${territoiresInactifs.length} territoires suivis ne sont plus référencés dans le référentiel des AAC`
              : `${territoiresInactifs.length} territoire suivi n'est plus référencé dans le référentiel des AAC`
          }
        >
          <div className="flex flex-col gap-2">
            {territoiresInactifs.map((territoire, index) => (
              <DepassementsListItem
                key={territoire.id}
                title={territoire.name ?? 'Territoire sans nom'}
                priority={index % 2 === 0 ? 'primary' : 'secondary'}
                depassementsAlerte={territoire.depassements_alerte}
                depassementsReglementaires={territoire.depassements_reglementaires}
                metas={getAacListItemMetas(territoire)}
              />
            ))}
          </div>
        </AlertDrawer>
      )}
    </>
  )
}
