/// <reference path="../../adonisrc.ts" />
/// <reference path="../../config/inertia.ts" />

import '@codegouvfr/react-dsfr/main.css'
import '@codegouvfr/react-dsfr/dsfr/dsfr.css'
import '@codegouvfr/react-dsfr/dsfr/utility/icons/icons.css'
import '../css/app.css'
import { hydrateRoot } from 'react-dom/client'
import { createInertiaApp, Link } from '@inertiajs/react'
import { resolvePageComponent } from '@adonisjs/inertia/helpers'
import { startReactDsfr } from '@codegouvfr/react-dsfr/spa'
import { fr } from '@codegouvfr/react-dsfr'
import { Toaster } from '../ui/Toaster'

startReactDsfr({ defaultColorScheme: 'system', Link })
declare module '@codegouvfr/react-dsfr/spa' {
  interface RegisterLink {
    Link: typeof Link
  }
}

const appName = import.meta.env.VITE_APP_NAME || 'Viz’Eau'

const blueFrance = fr.colors.decisions.background.actionHigh.blueFrance.active

createInertiaApp({
  progress: { color: blueFrance },

  title: (title) => `${title} - ${appName}`,

  resolve: (name) => {
    return resolvePageComponent(`../pages/${name}.tsx`, import.meta.glob('../pages/**/*.tsx'))
  },

  setup({ el, App, props }) {
    hydrateRoot(
      el,
      <>
        <App {...props} />
        <Toaster />
      </>
    )
  },
})
