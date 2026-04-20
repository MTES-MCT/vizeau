import { Head, usePage } from '@inertiajs/react'
import { fr } from '@codegouvfr/react-dsfr'
import { InferPageProps } from '@adonisjs/inertia/types'
import Layout from '~/ui/layouts/layout'
import AacController from '#controllers/aac_controller'
import Breadcrumb from '@codegouvfr/react-dsfr/Breadcrumb'
import { Tabs } from '@codegouvfr/react-dsfr/Tabs'
import TruncatedText from '~/ui/TruncatedText'
import AacInformationsCard from '~/components/aac-id/aac-informations-card'
import AacCommunesCard from '~/components/aac-id/aac-communes-card'
import { map } from 'lodash-es'
import { useEffect, useState } from 'react'
import AacTerritoireSection from '~/components/aac-id/aac-territoire-section'
import AacAgricultureSection from '~/components/aac-id/aac-agriculture-section'
import AacCaptages from '~/components/aac-id/aac-captages'
import { AacActionCard } from '~/components/aac-id/AacActionCard'

export default function AacShow({ aac, exportUrls }: InferPageProps<AacController, 'show'>) {
  const communeArray = map(aac.communes?.communes ?? {}, (info, nom) => ({ nom, ...info }))

  const { url } = usePage()
  const [, queryAndHash] = url.split('?')
  const queryString = (queryAndHash ?? '').split('#')[0]
  const urlParams = new URLSearchParams(queryString)
  const initialTab = urlParams.get('tab') === 'assolement' ? 'assolement' : 'captages'
  const [selectedTabId, setSelectedTabId] = useState(initialTab)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const hash = window.location.hash.slice(1)
    if (hash) {
      const el = document.getElementById(hash)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }, [selectedTabId])

  return (
    <Layout>
      <Head title={`${aac.nom} — AAC`} />
      <div
        className="fr-p-2w"
        style={{ backgroundColor: fr.colors.decisions.background.alt.blueFrance.default }}
      >
        <div className="fr-container flex justify-between items-center">
          <Breadcrumb
            currentPageLabel={
              <TruncatedText maxStringLength={50} hideTooltip>
                {aac.nom}
              </TruncatedText>
            }
            homeLinkProps={{
              href: '/accueil',
            }}
            segments={[
              {
                label: 'Liste des AAC',
                linkProps: {
                  href: '/aac',
                },
              },
            ]}
            className={'fr-my-0'}
          />
        </div>
      </div>
      <div className="fr-container fr-mt-4w fr-mb-4w">
        <h2 className="fr-h3 fr-mb-1w">{aac.nom}</h2>
        <section className="grid grid-cols-[350px_1fr] gap-4">
          <aside className="flex flex-col gap-4">
            <AacInformationsCard {...aac} />
            <AacCommunesCard communes={communeArray} />
            <AacActionCard exportUrls={exportUrls} />
          </aside>

          <Tabs
            selectedTabId={selectedTabId}
            onTabChange={setSelectedTabId}
            tabs={[
              {
                tabId: 'captages',
                label: 'Points de prélèvement',
                iconId: 'fr-icon-drop-line',
              },
              {
                tabId: 'assolement',
                label: 'Données d’assolement',
                iconId: 'fr-icon-leaf-line',
              },
            ]}
          >
            {selectedTabId === 'captages' && (
              <AacCaptages aacCode={aac.code} installations={aac.installations} />
            )}

            {selectedTabId === 'assolement' && (
              <div className="flex flex-col gap-4">
                <AacTerritoireSection {...aac} />
                <AacAgricultureSection {...aac} />
              </div>
            )}
          </Tabs>
        </section>
      </div>
    </Layout>
  )
}
