import { usePage } from '@inertiajs/react'
import { Alert } from '@codegouvfr/react-dsfr/Alert'
import { Button } from '@codegouvfr/react-dsfr/Button'
import { Checkbox } from '@codegouvfr/react-dsfr/Checkbox'
import { Input } from '@codegouvfr/react-dsfr/Input'
import { fr } from '@codegouvfr/react-dsfr'
import Avatar from '@codegouvfr/react-dsfr/picto/Avatar'
import { Form } from '@adonisjs/inertia/react'
import type { SharedProps } from '@adonisjs/inertia/types'

export default function AuthentificationBloc() {
  const borderColor = fr.colors.decisions.border.default.grey.default
  const linkColor = fr.colors.decisions.text.actionHigh.blueFrance.default

  const { flashMessages } = usePage<SharedProps>().props
  const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL
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
          {flashMessages.error?.code === 'E_INVALID_CREDENTIALS' && (
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
        <Form className="w-full fr-mt-1w" route={'session.store'}>
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
        {supportEmail && (
          <p className="fr-mt-3w">
            Des difficultés à vous connecter ?
            <a href={`mailto:${supportEmail}`} style={{ color: linkColor }} className="fr-ml-1w">
              Contactez un administrateur
            </a>
          </p>
        )}
      </div>
    </div>
  )
}
