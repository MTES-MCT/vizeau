import { Head } from '@inertiajs/react'
import Layout from '~/ui/layouts/layout'

import PublicHomepage from '~/components/accueil/public-homepage'

export default function Bienvenue() {
  return (
    <Layout isPublicPage>
      <Head title="Bienvenue" />
      <PublicHomepage />
    </Layout>
  )
}
