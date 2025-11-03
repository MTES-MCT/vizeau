import { Head } from '@inertiajs/react'
import Layout from '~/ui/layouts/layout'
import AuthentificationBloc from '~/components/authentification-bloc'

export default function Login() {
  return (
    <Layout>
      <Head title="Connexion" />
      <div className="fr-container flex flex-col justify-center gap-8 items-center min-h-screen">
        <AuthentificationBloc />
      </div>
    </Layout>
  )
}
