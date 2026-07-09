import ReactDOMServer from 'react-dom/server'
import { createInertiaApp, router } from '@inertiajs/react'
import { TuyauProvider } from '@adonisjs/inertia/react'
import { client } from '~/client'
import { Toaster } from '~/ui/Toaster'
import { MatomoTrackerInjector } from '~/components/matomo-tracker-injector'
import { FlashMessages, showFlashToasts } from '~/functions/flash_messages'

export default function render(page: any) {
  return createInertiaApp({
    page,
    render: ReactDOMServer.renderToString,
    resolve: (name) => {
      const pages = import.meta.glob('./pages/**/*.tsx', { eager: true })
      return pages[`./pages/${name}.tsx`]
    },
    setup({ App, props }) {
      showFlashToasts(props.initialPage.props.flashMessages as FlashMessages | undefined)

      router.on('success', (event) => {
        showFlashToasts(event.detail.page.props.flashMessages as FlashMessages | undefined)
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
