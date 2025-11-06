import { Head } from '@inertiajs/react'

import Layout from '~/ui/layouts/layout'

export default function Accueil() {
  return (
    <Layout>
      <Head title="Accueil" />
      <div className="fr-container fr-mt-3w">
        <h1>Accueil</h1>
      </div>
    </Layout>
  )
}
