/// <reference path="../../adonisrc.ts" />
/// <reference path="../../config/inertia.ts" />

import '@codegouvfr/react-dsfr/main.css'
import '@codegouvfr/react-dsfr/dsfr/dsfr.css'
import '@codegouvfr/react-dsfr/dsfr/utility/icons/icons.css'
import '../css/app.css'
import { hydrateRoot } from 'react-dom/client'
import { createInertiaApp, Link, router } from '@inertiajs/react'
import { resolvePageComponent } from '@adonisjs/inertia/helpers'
import { startReactDsfr } from '@codegouvfr/react-dsfr/spa'
import { fr } from '@codegouvfr/react-dsfr'
import { toast } from 'react-toastify'
import Toast, { Toaster } from '../ui/Toaster'
import { MatomoTrackerInjector } from '~/components/matomo-tracker-injector'

startReactDsfr({ defaultColorScheme: 'system', Link })
declare module '@codegouvfr/react-dsfr/spa' {
  interface RegisterLink {
    Link: typeof Link
  }
}

const appName = import.meta.env.VITE_APP_NAME || 'Viz’Eau'

const blueFrance = fr.colors.decisions.background.actionHigh.blueFrance.active
const TOAST_SEVERITIES = ['success', 'error', 'warning', 'info'] as const

type ToastSeverity = (typeof TOAST_SEVERITIES)[number]

type FlashMessages = Partial<
  Record<
    ToastSeverity,
    {
      message?: string
      context?: string
    } | null
  >
>

function showFlashToasts(flashMessages?: FlashMessages) {
  const alerts = TOAST_SEVERITIES.filter(
    (severity) => flashMessages?.[severity]?.message && !flashMessages?.[severity]?.context
  ).map((severity) => ({
    severity,
    message: flashMessages?.[severity]?.message as string,
  }))

  if (alerts.length === 0) return

  const toastId = alerts.map((a) => `${a.severity}:${a.message}`).join('|')
  if (toast.isActive(toastId)) return

  toast(<Toast alerts={alerts} />, {
    toastId,
    closeButton: false,
    style: { padding: 0, background: 'transparent', boxShadow: 'none' },
  })
}

createInertiaApp({
  progress: { color: blueFrance },

  title: (title) => `${title} - ${appName}`,

  resolve: (name) => {
    return resolvePageComponent(`../pages/${name}.tsx`, import.meta.glob('../pages/**/*.tsx'))
  },

  setup({ el, App, props }) {
    showFlashToasts(props.initialPage.props.flashMessages as FlashMessages | undefined)

    router.on('success', (event) => {
      showFlashToasts(event.detail.page.props.flashMessages as FlashMessages | undefined)
    })

    hydrateRoot(
      el,
      <>
        <App {...props} />
        <Toaster />
        <MatomoTrackerInjector />
      </>
    )
  },
})
