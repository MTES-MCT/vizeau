import ReactDOMServer from 'react-dom/server'
import { createInertiaApp, router } from '@inertiajs/react'
import { TuyauProvider } from '@adonisjs/inertia/react'
import { client } from '~/client'
import { Toaster } from '~/ui/Toaster'
import { MatomoTrackerInjector } from '~/components/matomo-tracker-injector'
import { FlashMessages, showFlashToasts } from '~/functions/flash_messages'

/// <reference path="./types.ts" />

export default function render(page: any) {
  return createInertiaApp({
    page,
    render: ReactDOMServer.renderToString,
    resolve: (name) => {
      const pages = import.meta.glob('./pages/**/*.tsx', { eager: true })
      return pages[`./pages/${name}.tsx`]
    },
    setup({ App, props }) {
      showFlashToasts(props.initialPage.flash as FlashMessages | undefined)

      router.on('flash', (event) => {
        showFlashToasts(event.detail.flash as FlashMessages | undefined)
      })

      return (
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
}
