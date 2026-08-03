import { Head } from '@inertiajs/react'
import Layout from '~/ui/layouts/layout'

import DashboardHomepage, {
  type DashboardHomepageProps,
} from '~/components/accueil/dashboard-homepage'

export default function Accueil({ latestExploitations, latestLogEntries }: DashboardHomepageProps) {
  return (
    <Layout>
      <Head title="Accueil" />
      <DashboardHomepage
        latestExploitations={latestExploitations}
        latestLogEntries={latestLogEntries}
      />
    </Layout>
  )
}
