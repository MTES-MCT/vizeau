import { useState } from 'react'
import { Link, router, usePage } from '@inertiajs/react'
import { Alert } from '@codegouvfr/react-dsfr/Alert'
import { Button } from '@codegouvfr/react-dsfr/Button'
import { Checkbox } from '@codegouvfr/react-dsfr/Checkbox'
import { Input } from '@codegouvfr/react-dsfr/Input'
import { fr } from '@codegouvfr/react-dsfr'
import Avatar from '@codegouvfr/react-dsfr/picto/Avatar'

export default function AuthentificationBloc() {
  const borderColor = fr.colors.decisions.border.default.grey.default
  const linkColor = fr.colors.decisions.text.actionHigh.blueFrance.default

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [emailError, setEmailError] = useState('')

  const { errors } = usePage().props

  function handleSubmit(e: { preventDefault: () => void }) {
    e.preventDefault()

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailRegex.test(email)) {
      setEmailError('Veuillez saisir une adresse e-mail valide')
      return
    }

    setEmailError('')

    router.post('/login', {
      email,
      password,
      remember_me: rememberMe,
    })
  }

  return (
    <div className="flex justify-center items-center w-full">
      <div
        className="flex flex-col justify-center items-center fr-p-3w w-full max-w-[700px]"
        style={{ border: `1px solid ${borderColor}`, borderRadius: '8px' }}
      >
        <div className="fr-m-4w">
          <div className="m-4 flex justify-center">
            <Avatar fontSize="150px" />
          </div>
          <h4 className="text-center">Authentification</h4>
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
            />
          )}
        </div>
        <form onSubmit={handleSubmit} className="w-full fr-mt-2w">
          <Input
            label="Adresse e-mail"
            state={emailError ? 'error' : 'default'}
            stateRelatedMessage={emailError}
            nativeInputProps={{
              name: 'email',
              placeholder: 'exemple@mon-email.fr',
              type: 'text',
              value: email,
              onChange: (e) => {
                setEmail(e.target.value)
                setEmailError('')
              },
            }}
          />
          <Input
            label="Mot de passe"
            nativeInputProps={{
              name: 'password',
              type: 'password',
              value: password,
              onChange: (e) => setPassword(e.target.value),
            }}
          />
          <div className="fr-p-2w float-end">
            <Checkbox
              options={[
                {
                  label: 'Se souvenir de moi',
                  nativeInputProps: {
                    name: 'rememberMe',
                    checked: rememberMe,
                    onChange: (e) => setRememberMe(e.target.checked),
                  },
                },
              ]}
              small
            />
          </div>
          <Button
            className="w-full justify-center"
            type="submit"
            disabled={email === '' || password === ''}
          >
            S'authentifier
          </Button>
        </form>
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
