import { Head } from '@inertiajs/react'
import Layout from '~/ui/layouts/layout'

import type { TerritoireJson, ProchainesTacheJson, ProjectJson } from '#types/models'
import type {
  ConformiteRepartitionJson,
  SubstancesRepartitionJson,
  CaptageAlerteJson,
} from '#types/captage'
import { router } from '@inertiajs/react'
import Hero from '~/components/accueil/hero'
import TerritoiresAlertes from '~/components/accueil/territoires-alertes'
import SubstancesAlertes from '~/components/accueil/substances-alertes'
import ProchainesTaches from '~/components/accueil/prochaines-taches'
import ProjetsEnCours from '~/components/accueil/projets-en-cours'
import CaptagesAlertes from '~/components/accueil/captages-alertes'
import SectionCard from '~/ui/SectionCard'
import Button from '@codegouvfr/react-dsfr/Button'

export type DashboardHomepageProps = {
  urgentTasksCount: number
  currentProjects: ProjectJson[]
  territoires: TerritoireJson[]
  conformiteRepartition?: ConformiteRepartitionJson
  substancesRepartition?: SubstancesRepartitionJson
  captagesAlertes: CaptageAlerteJson[]
  prochainesTaches: ProchainesTacheJson[]
}

export default function Accueil({
  urgentTasksCount,
  currentProjects,
  territoires,
  conformiteRepartition,
  substancesRepartition,
  captagesAlertes,
  prochainesTaches,
}: DashboardHomepageProps) {
  return (
    <Layout>
      <Head title="Accueil" />
      <>
        <Hero urgentTasksCount={urgentTasksCount} currentProjectsCount={currentProjects.length} />

        <div className="fr-px-2w fr-px-lg-16w fr-py-4w">
          <div className="fr-grid-row fr-grid-row--gutters items-start">
            <aside className="flex flex-col gap-4 fr-col-12 fr-col-lg-4">
              <SectionCard size="small" title="Actions rapides">
                <Button
                  iconId="fr-icon-briefcase-line"
                  className="justify-center"
                  style={{ width: '100%' }}
                  onClick={() => router.visit('/projets/creation')}
                >
                  Démarrer un nouveau projet
                </Button>
              </SectionCard>
              <SubstancesAlertes
                territoires={territoires}
                substancesRepartition={substancesRepartition}
              />
              <TerritoiresAlertes
                territoires={territoires}
                conformiteRepartition={conformiteRepartition}
              />
            </aside>

            <main className="fr-col-12 flex flex-col fr-col-lg-8 min-w-0 gap-4">
              <CaptagesAlertes captages={captagesAlertes} />
              <div id="prochaines-taches">
                <ProchainesTaches prochainesTaches={prochainesTaches} />
              </div>
              <div id="projets-en-cours">
                <ProjetsEnCours projets={currentProjects} />
              </div>
            </main>
          </div>
        </div>
      </>
    </Layout>
  )
}
