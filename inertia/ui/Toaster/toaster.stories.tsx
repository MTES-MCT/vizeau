import { useEffect } from 'react'
import Button from '@codegouvfr/react-dsfr/Button.js'
import Toast, { Toaster } from './index.js'
import { toast } from 'react-toastify'

const meta = {
  title: 'UI/Toaster',
  component: Toaster,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: "Composant Toaster pour afficher des notifications temporaires à l'utilisateur.",
      },
      story: {
        inline: false,
        iframeHeight: 400,
      },
    },
  },
}

export default meta

export const Défaut = () => {
  const notify = () => {
    toast(
      <Toast
        alerts={[
          { severity: 'info', message: "Ceci est une alerte d'information." },
          { severity: 'warning', message: "Ceci est une alerte d'avertissement." },
          { severity: 'error', message: "Ceci est une alerte d'erreur." },
        ]}
      />,
      { containerId: 'defaut' }
    )
  }

  return (
    <div>
      <Button onClick={notify}>Afficher le Toaster</Button>
      <Toaster containerId="defaut" />
    </div>
  )
}

export const SansFermetureAutomatique = () => {
  useEffect(() => {
    toast(
      <Toast
        alerts={[
          { severity: 'info', message: "Ceci est une alerte d'information." },
          { severity: 'warning', message: "Ceci est une alerte d'avertissement." },
          { severity: 'error', message: "Ceci est une alerte d'erreur." },
        ]}
      />,
      { toastId: 'sans-fermeture-auto', containerId: 'sans-fermeture' }
    )
  }, [])

  return (
    <div style={{ height: '700px' }}>
      <Toaster autoClose={false} containerId="sans-fermeture" />
    </div>
  )
}
