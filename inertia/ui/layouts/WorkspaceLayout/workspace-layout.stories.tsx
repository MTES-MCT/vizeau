import { useState } from 'react'
import { Button } from '@codegouvfr/react-dsfr/Button'

import WorkspaceLayout, { WorkspaceLayoutProps } from './index.js'

const meta = {
  title: 'Ui/layouts/WorkspaceLayout',
  component: WorkspaceLayout,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          "Espace de travail en trois zones (panneau gauche, centre, panneau droit) avec un pied d'actions. En `overlay`, il couvre tout l'écran ; en `inline`, il remplit son conteneur. Sous 62em, les trois zones deviennent des onglets.",
      },
    },
  },
}

export default meta

const footer = (
  <>
    <p className="fr-text--sm fr-m-0">Résumé de l'état en cours</p>
    <div className="flex gap-2">
      <Button priority="secondary">Annuler</Button>
      <Button iconId="fr-icon-check-line">Valider</Button>
    </div>
  </>
)

const args: Omit<WorkspaceLayoutProps, 'variant' | 'isOpen' | 'onClose'> = {
  title: "Titre de l'espace de travail",
  subtitle: 'Sous-titre facultatif',
  left: {
    title: 'Panneau gauche',
    tabLabel: 'Gauche',
    toolbar: <p className="fr-m-0">Barre toujours visible</p>,
    content: (
      <div className="flex flex-col gap-4">
        {Array.from({ length: 30 }, (_, index) => (
          <p key={index} className="fr-m-0">
            Contenu qui défile {index + 1}
          </p>
        ))}
      </div>
    ),
  },
  center: {
    tabLabel: 'Centre',
    content: (
      <div className="flex flex-1 items-center justify-center bg-gray-100">Zone centrale</div>
    ),
  },
  right: {
    title: 'Panneau droit',
    headerContent: (
      <Button priority="tertiary" size="small" iconId="fr-icon-settings-5-line">
        Contenu de header personnalisé
      </Button>
    ),
    tabLabel: 'Droite',
    badge: 3,
    content: (
      <ul>
        <li>Élément 1</li>
        <li>Élément 2</li>
        <li>Élément 3</li>
      </ul>
    ),
  },
  footer,
}

export const Superposition = () => {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <div className="fr-p-4w">
      <Button onClick={() => setIsOpen(true)}>Ouvrir l'espace de travail</Button>
      <WorkspaceLayout
        {...args}
        variant="overlay"
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </div>
  )
}

export const DansLaPage = () => (
  <div className="h-screen">
    <WorkspaceLayout {...args} variant="inline" isOpen onClose={() => {}} />
  </div>
)

export const Mobile = {
  render: DansLaPage,
  globals: { viewport: { value: 'mobile2', isRotated: false } },
}
