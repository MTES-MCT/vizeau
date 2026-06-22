import { useState } from 'react'
import { Head } from '@inertiajs/react'
import { InferPageProps } from '@adonisjs/inertia/types'
import { fr } from '@codegouvfr/react-dsfr'
import { Breadcrumb } from '@codegouvfr/react-dsfr/Breadcrumb'
import ProjectsController from '#controllers/projects_controller'

import Layout from '~/ui/layouts/layout'
import TruncatedText from '~/ui/TruncatedText'
import ProjetInfosCard from '~/components/projets/projet-infos-card'
import { CallOut } from '@codegouvfr/react-dsfr/CallOut'
import { Tabs } from '@codegouvfr/react-dsfr/Tabs'
import ProjetParcellesList from '~/components/projets/projet-parcelles-list'
import ExploitationsList from '~/components/exploitations/exploitations-list'
import ProjetInstallationsList from '~/components/projets/projet-installations-list'
import DeleteAlert from '~/ui/DeleteAlert'
import { createModal } from '@codegouvfr/react-dsfr/Modal'
import { router } from '@inertiajs/react'
import Alert from '@codegouvfr/react-dsfr/Alert'
import Input from '@codegouvfr/react-dsfr/Input'
import EmptyPlaceholder from '~/ui/EmptyPlaceholder'
import { Button } from '@codegouvfr/react-dsfr/Button'

const deleteProjetModal = createModal({
  id: 'delete-projet-modal',
  isOpenedByDefault: false,
})

export default function ShowProjet({ projet }: InferPageProps<ProjectsController, 'show'>) {
  const [isDescriptionVisible, setIsDescriptionVisible] = useState(false)
  const [isDeleteButtonDisabled, setIsDeleteButtonDisabled] = useState(true)
  const toggleDescription = () => {
    setIsDescriptionVisible(!isDescriptionVisible)
  }
  const descriptionToShow =
    projet.description && projet.description.length > 800 && !isDescriptionVisible
      ? projet.description.substring(0, 800) + '...'
      : projet.description

  return (
    <Layout>
      <Head title={projet.name} />
      <div
        className="fr-p-2w"
        style={{ backgroundColor: fr.colors.decisions.background.alt.blueFrance.default }}
      >
        <div className="fr-container flex justify-between items-center">
          <Breadcrumb
            currentPageLabel={
              <TruncatedText maxStringLength={50} hideTooltip>
                {projet.name}
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
            className="fr-my-0"
          />
        </div>
      </div>
      <div className="fr-container fr-mt-4w fr-mb-4w">
        <div className="flex items-center justify-between fr-mb-2w">
          <h2 className="fr-h3 fr-mb-0">{projet.name}</h2>
          <Button
            priority="secondary"
            iconId="fr-icon-edit-line"
            linkProps={{ href: `/projets/edition/${projet.id}` }}
          >
            Modifier le projet
          </Button>
        </div>
        <section className="grid grid-cols-[350px_1fr] gap-4">
          <aside className="flex flex-col gap-4">
            <ProjetInfosCard projet={projet} />
            <DeleteAlert
              title="Supprimer ce projet"
              description="Êtes-vous sûr de vouloir supprimer ce projet ? Cette action est irréversible."
              size="md"
              onDelete={deleteProjetModal.open}
            />

            <deleteProjetModal.Component
              title="Confirmer la suppression du projet"
              size="large"
              buttons={[
                { children: 'Annuler', doClosesModal: true, type: 'button' },
                {
                  children: 'Supprimer le projet',
                  disabled: isDeleteButtonDisabled,
                  type: 'button',
                  onClick: () => {
                    router.delete(`/projets/${projet.id}`)
                  },
                },
              ]}
            >
              <Alert
                severity="error"
                title="Suppression d'un projet"
                description="Vous êtes sur le point de supprimer ce projet. Cette action est irréversible et entraînera la suppression de toutes les données associées."
              />
              <div className="fr-mt-3w">
                <Input
                  label={`Pour confirmer la suppression, veuillez taper "${projet.name}" :`}
                  nativeInputProps={{
                    placeholder: projet.name,
                    onChange: (e) => {
                      setIsDeleteButtonDisabled(e.currentTarget.value !== projet.name)
                    },
                  }}
                />
              </div>
            </deleteProjetModal.Component>
          </aside>

          <div className="min-w-0">
            <CallOut
              title="Description du projet"
              {...(projet.description &&
                projet.description.length > 800 && {
                  buttonProps: {
                    children: isDescriptionVisible
                      ? 'Réduire la description'
                      : 'Afficher la description complète',
                    onClick: toggleDescription,
                  },
                })}
            >
              {descriptionToShow || 'Aucune description fournie'}
            </CallOut>

            <Tabs
              label="Détails du projet"
              onTabChange={function noRefCheck() {}}
              tabs={[
                {
                  content: <ProjetParcellesList parcelles={projet.parcelles} />,
                  iconId: 'fr-icon-collage-line',
                  label: 'Parcelles',
                },
                {
                  content:
                    projet.exploitations.length === 0 ? (
                      <EmptyPlaceholder
                        illustrativeIcon="fr-icon-collage-fill"
                        label="Aucune exploitation associée"
                      />
                    ) : (
                      <ExploitationsList exploitations={projet.exploitations} />
                    ),
                  iconId: 'fr-icon-map-pin-user-fill',
                  label: 'Exploitations',
                },
                {
                  content: <ProjetInstallationsList captages={projet.captages} />,
                  iconId: 'fr-icon-drop-line',
                  label: 'Points de prélèvement',
                },
              ]}
            />
          </div>
        </section>
      </div>
    </Layout>
  )
}
