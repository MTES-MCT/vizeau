import { fr } from '@codegouvfr/react-dsfr'
import Button from '@codegouvfr/react-dsfr/Button'
import { Head } from '@inertiajs/react'
import ExploitationsList from '~/components/exploitations/exploitations-list'
import CompactListItem from '~/ui/CompactListItem'
import type { ExploitationJson, LogEntryJson } from '../../types/models'

import Layout from '~/ui/layouts/layout'

interface AccueilProps {
  latestExploitations: ExploitationJson[]
  latestLogEntries: Array<
    LogEntryJson & {
      exploitation: {
        id: number
        name: string | null
    }
      createdAt: string
      tags: Array<{
        id: number
        name: string
      }> | null
    }
  >
}

export default function Accueil({ latestExploitations, latestLogEntries }: AccueilProps) {
  return (
    <Layout>
      <Head title="Accueil" />
      <div style={{ backgroundColor: fr.colors.decisions.background.alt.blueFrance.default }}>
        <div className="fr-container flex justify-between fr-my-10w">
          <div className="fr-col-6">
            <h2>Pilotage de la protection des captages</h2>
            <p style={{ marginTop: '-1em', color: fr.colors.decisions.text.mention.grey.default }}>
              Des données structurées pour agir sur la protection de la ressource en eau.
            </p>
            <p>
              <small>
                L‘application facilite l‘accès, le traitement et le partage des données liées à la
                qualité de l‘eau aux captages. Elle produit un état des lieux clair et directement
                exploitable pour la réalisation de l‘étude des dangers. Un outil simple pour appuyer
                les collectivités et services de l‘État dans la protection de la ressource en eau.
              </small>
            </p>
            <div className="fr-grid-row fr-grid-row--gutters fr-mt-6w">
              <Button iconId="fr-icon-map-pin-user-line" className="fr-m-1w" linkProps={{ href: '/exploitations/creation' }}>
                Ajouter une exploitation
              </Button>
              <Button disabled iconId="fr-icon-pen-nib-line" priority="secondary" className="fr-m-1w">
                Remplir le journal de bord
              </Button>
            </div>
          </div>
          <div className="fr-col-5">
            <img src="Illustration-hero.png" alt="Illustration hero" className="fr-px-6w" />
          </div>
        </div>
      </div>
      <div>
        <div className="fr-container fr-my-8w">
          <div className="flex justify-between">
            <h3>Dernières notes de terrain ajoutées</h3>
            <div>
              <Button iconId="fr-icon-pen-nib-line" disabled>Remplir le journal de bord</Button>
            </div>
          </div>
          {latestLogEntries.map((log) => (
            <CompactListItem
              key={log.id}
              label={
                log.notes
                  ? log.notes.substring(0, 30) + (log.notes.length > 30 ? '...' : '')
                  : 'Note sans contenu'
              }
              tags={
                log.tags && log.tags.length > 0 ? log.tags.map((tag) => ({ label: tag.name })) : []
              }
              metas={[
                {
                  content: new Date(log.createdAt).toLocaleDateString(),
                  iconId: 'fr-icon-calendar-event-line',
                },
                {
                  content: log.exploitation.name || 'Exploitation inconnue',
                  iconId: 'fr-icon-map-pin-user-line',
                },
              ]}
              actions={[]}
            />
          ))}
        </div>
      </div>
      <div
        className="fr-py-10w"
        style={{ backgroundColor: fr.colors.decisions.background.alt.grey.default }}
      >
        <div className="fr-container">
          <div className="flex justify-between">
            <h3>Dernières exploitations créées</h3>
            <div>
              <Button iconId="fr-icon-arrow-right-line" linkProps={{ href: '/exploitations' }}>
                Consulter les exploitations
              </Button>
            </div>
          </div>
          <div className="fr-my-4w">
            <ExploitationsList exploitations={latestExploitations} />
          </div>
        </div>
      </div>
    </Layout>
  )
}
