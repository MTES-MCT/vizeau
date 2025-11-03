import { Form, Link, usePage } from '@inertiajs/react'
import { Alert } from '@codegouvfr/react-dsfr/Alert'
import { Button } from '@codegouvfr/react-dsfr/Button'
import { Checkbox } from '@codegouvfr/react-dsfr/Checkbox'
import { Input } from '@codegouvfr/react-dsfr/Input'
import { fr } from '@codegouvfr/react-dsfr'
import Avatar from '@codegouvfr/react-dsfr/picto/Avatar'

export default function AuthentificationBloc() {
  const borderColor = fr.colors.decisions.border.default.grey.default
  const linkColor = fr.colors.decisions.text.actionHigh.blueFrance.default

  const { errors } = usePage().props

  return (
    <div className="flex justify-center items-center w-full">
      <div
        className="flex flex-col justify-center items-center fr-p-3w w-full max-w-[700px]"
        style={{ border: `1px solid ${borderColor}`, borderRadius: '8px' }}
      >
        <div>
          <div className="m-4 flex justify-center">
            <Avatar fontSize="150px" />
          </div>
          <h4 className="text-center fr-mb-1w">Authentification</h4>
          <p>Entrez votre email pour accéder à l'application</p>
        </div>
        <div className="fr-p-3w">
          {errors && errors.E_INVALID_CREDENTIALS && (
            <Alert
              description={
                "Les informations d'identification fournies sont incorrectes. Veuillez vérifier votre adresse e-mail et votre mot de passe, puis réessayer."
              }
              severity="error"
              title="Erreur d'authentification"
              className="fr-my-3w"
            />
          )}
        </div>
        <Form className="w-full fr-mt-1w" action="/login" method="post">
          <Input
            label="Adresse e-mail"
            nativeInputProps={{
              name: 'email',
              placeholder: 'exemple@mon-email.fr',
              type: 'email',
              required: true,
            }}
          />
          <Input
            label="Mot de passe"
            nativeInputProps={{
              name: 'password',
              type: 'password',
              required: true,
            }}
          />
          <div className="fr-p-2w float-end">
            <Checkbox
              options={[
                {
                  label: 'Se souvenir de moi',
                  nativeInputProps: {
                    name: 'remember_me',
                    value: 'yes',
                  },
                },
              ]}
              small
            />
          </div>
          <Button className="w-full justify-center" type="submit">
            S'authentifier
          </Button>
        </Form>
        <p className="fr-mt-3w">
          Des difficultés à vous connecter ?{' '}
          <Link href="#" style={{ color: linkColor }}>
            Contactez un administrateur
          </Link>
        </p>
      </div>
    </div>
  )
}
