import AlertDrawer, { AlertDrawerProps } from './index.js'

const meta = {
  title: 'UI/AlertDrawer',
  component: AlertDrawer,
  tags: ['autodocs'],
  argTypes: {
    // Définir les argTypes si nécessaire
  },
  args: {
    severity: 'info',
    title: 'Titre de l’alerte',
    customIconId: undefined,
    children: <>Contenu de l’alerte</>,
  } as AlertDrawerProps,
}

export default meta

export const Défaut = {}

export const AlerteWarning = {
  args: {
    severity: 'warning',
    title: 'Alerte de type Warning',
    children: <>Ceci est une alerte de type warning.</>,
  },
}

export const AlerteError = {
  args: {
    severity: 'error',
    title: 'Alerte de type Error',
    children: <>Ceci est une alerte de type error.</>,
  },
}

export const AlerteSuccess = {
  args: {
    severity: 'success',
    title: 'Alerte de type Success',
    children: <>Ceci est une alerte de type success.</>,
  },
}

export const AlerteAvecIconePersonnalisee = {
  args: {
    severity: 'warning',
    title: 'Alerte avec icône personnalisée',
    customIconId: 'fr-icon-notification-3-line',
    children: <>Ceci est une alerte avec une icône personnalisée.</>,
  },
}
