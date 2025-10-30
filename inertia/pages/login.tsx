import { Form, Head, usePage } from '@inertiajs/react'
import Layout from './layout'
import Alert from '@codegouvfr/react-dsfr/Alert'

export default function Login() {
  const { errors } = usePage().props
  return (
    <Layout>
      <Head title="Connexion" />
      <div className="fr-container">
        {errors &&
          Object.keys(errors).map((errorKey) => (
            <Alert
              key={errorKey}
              description={errors[errorKey]}
              severity="error"
              title="Une erreur a eu lieu"
            />
          ))}

        <Form action="/login" method="post" className="flex flex-col">
          <label htmlFor="email">Adresse e-mail:</label>
          <input type="email" id="email" name="email" />

          <label htmlFor="password">Mot de passe:</label>
          <input type="password" id="password" name="password" />

          <label htmlFor="remember_me">Se souvenir de moi</label>
          <input type="checkbox" id="remember_me" name="remember_me" />

          <button type="submit">Se connecter</button>
        </Form>
      </div>
    </Layout>
  )
}
