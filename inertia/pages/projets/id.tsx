import { InferPageProps } from '@adonisjs/inertia/types'
import { Head } from '@inertiajs/react'

import ProjetsController from '#controllers/projets_controller'
import { fr } from '@codegouvfr/react-dsfr'

import { Breadcrumb } from '@codegouvfr/react-dsfr/Breadcrumb'
import { Button } from '@codegouvfr/react-dsfr/Button'

import TruncatedText from '~/ui/TruncatedText'

import Layout from '~/ui/layouts/layout'
import ProjectInformationsCard from '~/components/projets/projet-informations-card'

import ProjectMainTabs from '~/components/projets/projet-main-tabs'
import ProjectDescription from '~/components/projets/projet-description'

export default function SingleProjet({ projet }: InferPageProps<ProjetsController, 'get'>) {
  return (
    <Layout>
      <Head title={projet.nom} />
      <div
        className="fr-p-2w"
        style={{ backgroundColor: fr.colors.decisions.background.alt.blueFrance.default }}
      >
        <div className="fr-container flex justify-between items-center">
          <Breadcrumb
            currentPageLabel={
              <TruncatedText maxStringLength={50} hideTooltip>
                {projet.nom}
              </TruncatedText>
            }
            homeLinkProps={{
              href: '/accueil',
            }}
            segments={[
              {
                label: 'Projets',
                linkProps: {
                  href: '/projets',
                },
              },
            ]}
            className={'fr-my-0'}
          />
          <div className="flex items-center">
            <Button
              iconId="fr-icon-edit-line"
              priority={'secondary'}
              linkProps={{ href: `/projets/edition/${projet.id}` }}
            >
              Éditer le projet
            </Button>
          </div>
        </div>
      </div>

      <div className="fr-container fr-mt-4w fr-mb-4w">
        <h2 className="fr-h3 fr-mb-1w">{projet.nom}</h2>
        <section className="grid grid-cols-[350px_1fr] gap-4">
          <aside className="flex flex-col gap-4">
            <ProjectInformationsCard
              updatedAt={projet.updated_at}
              createdAt={projet.created_at}
              statut={projet.statut}
              typeAction={projet.type_action}
            />
          </aside>
          <div className="flex flex-col gap-2">
            <ProjectDescription description={projet.description} />
            <ProjectMainTabs
              parcelles={projet.parcelles}
              exploitations={projet.exploitations}
              installations={projet.installations}
              etapes={projet.etapes}
            />
          </div>
        </section>
      </div>
    </Layout>
  )
}
