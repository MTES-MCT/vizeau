/// <reference path="../adonisrc.ts" />
/// <reference path="../config/inertia.ts" />

import '@codegouvfr/react-dsfr/main.css'
import '@codegouvfr/react-dsfr/dsfr/dsfr.css'
import '@codegouvfr/react-dsfr/dsfr/utility/icons/icons.css'
import './css/app.css'
import { hydrateRoot } from 'react-dom/client'
import { createInertiaApp, router } from '@inertiajs/react'
import { resolvePageComponent } from '@adonisjs/inertia/helpers'
import { startReactDsfr } from '@codegouvfr/react-dsfr/spa'
import { fr } from '@codegouvfr/react-dsfr'

import { Toaster } from './ui/Toaster'
import { MatomoTrackerInjector } from '~/components/matomo-tracker-injector'
import { client } from '~/client'
import { Link, TuyauProvider } from '@adonisjs/inertia/react'
import { FlashMessages, showFlashToasts } from '~/functions/flash_messages'

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
    return resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx'))
  },

  setup({ el, App, props }) {
    showFlashToasts(props.initialPage.props.flashMessages as FlashMessages | undefined)

    router.on('success', (event) => {
      showFlashToasts(event.detail.page.props.flashMessages as FlashMessages | undefined)
    })

    hydrateRoot(
      el,
      <>
        <TuyauProvider client={client}>
          <App {...props} />
        </TuyauProvider>
        <Toaster />
        <MatomoTrackerInjector />
      </>
    )
  },
})
