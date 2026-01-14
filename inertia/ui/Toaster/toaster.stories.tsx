import { useEffect, useRef } from 'react'
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
        component: "Composant Toaster pour afficher des notifications temporaires à l'utilisateur. Le composant Toast reçoit automatiquement une fonction `closeToast` de react-toastify qui permet de fermer le toast programmatiquement. Utilisez cette fonction pour fermer le toast lorsque toutes les alertes sont fermées.\n\n**Important:** Dans l'application, un Toaster sans `containerId` est monté au niveau racine. Pour afficher des toasts dans ce conteneur par défaut, appelez `toast()` **sans** l'option `containerId`. Les exemples ci-dessous utilisent des `containerId` explicites pour isoler les toasts dans Storybook.",
      },
      story: {
        inline: false,
        iframeHeight: 400,
      },
    },
  },
}

export default meta

export const SansContainerId = () => {
  const notify = () => {
    toast(
      <Toast
        alerts={[
          { severity: 'success', message: 'Toast sans containerId pour le Toaster racine' },
        ]}
      />
      // Pas de containerId ici - s'affichera dans le Toaster sans containerId
    )
  }

  return (
    <div>
      <Button onClick={notify}>Afficher le Toaster (usage racine)</Button>
      <Toaster />
    </div>
  )
}

SansContainerId.parameters = {
  docs: {
    description: {
      story: "Exemple d'utilisation recommandée pour le Toaster racine de l'application. Appelez `toast()` sans l'option `containerId` pour afficher le toast dans le conteneur par défaut.",
    },
  },
}

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

Défaut.parameters = {
  docs: {
    description: {
      story: "Exemple avec un `containerId` explicite. Utile pour gérer plusieurs conteneurs de toasts indépendants.",
    },
  },
}

export const SansFermetureAutomatique = () => {
  const hasShown = useRef(false)

  useEffect(() => {
    if (!hasShown.current) {
      hasShown.current = true
      toast(
        <Toast
          alerts={[
            { severity: 'info', message: "Ceci est une alerte d'information." },
            { severity: 'warning', message: "Ceci est une alerte d'avertissement." },
            { severity: 'error', message: "Ceci est une alerte d'erreur." },
          ]}
        />,
        { containerId: 'sans-fermeture', toastId: 'sans-fermeture-toast' }
      )
    }
  }, [])

  return (
    <div style={{ height: '700px' }}>
      <Toaster autoClose={false} containerId="sans-fermeture" />
    </div>
  )
}

export const AvecUnSeulMessage = () => {
  const notify = () => {
    toast(
      <Toast
        alerts={[{ severity: 'info', message: "Ceci est une alerte d'information unique." }]}
      />,
      { containerId: 'un-seul-message' }
    )
  }

  return (
    <div>
      <Button onClick={notify}>Afficher le Toaster</Button>
      <Toaster containerId="un-seul-message" />
    </div>
  )
}
