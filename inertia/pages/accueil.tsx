import { Head } from '@inertiajs/react'
import Layout from '~/ui/layouts/layout'

import DashboardHomepage from '~/components/accueil/dashboard-homepage'
import PublicHomepage from '~/components/accueil/public-homepage'

export default function Accueil({ isPublic, latestExploitations, latestLogEntries }: any) {
  const AccueilContent = isPublic ? PublicHomepage : DashboardHomepage

  return (
    <Layout isPublicPage={isPublic}>
      <Head title={isPublic ? 'Bienvenue' : 'Accueil'} />
      <AccueilContent
        latestExploitations={latestExploitations}
        latestLogEntries={latestLogEntries}
      />
    </Layout>
  )
}
