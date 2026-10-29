import { Head } from '@inertiajs/react'
import Layout from '~/ui/layouts/Layout'

import PublicHomepage from '~/components/accueil/public-homepage'

export default function Bienvenue() {
  return (
    <Layout isPublicPage>
      <Head title="Bienvenue" />
      <PublicHomepage />
    </Layout>
  )
}
