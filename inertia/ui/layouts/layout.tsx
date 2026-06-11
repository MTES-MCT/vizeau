import { useEffect } from 'react'
import { Button } from '@codegouvfr/react-dsfr/Button'
import { Header } from '@codegouvfr/react-dsfr/Header'
import { headerFooterDisplayItem } from '@codegouvfr/react-dsfr/Display'
import { Footer } from '@codegouvfr/react-dsfr/Footer'
import { fr } from '@codegouvfr/react-dsfr'
import { toast } from 'react-toastify'
import { usePage } from '@inertiajs/react'
import Toast from '~/ui/Toaster'

export default function Layout({
  children,
  hideFooter = false,
  isMapLayout = false,
}: React.PropsWithChildren<{ hideFooter?: boolean; isMapLayout?: boolean }>) {
  const { url, props } = usePage<any>()
  const { flashMessages } = props
  const pathname = url.split('?')[0]
  const isLoginPage = url === '/login'

  useEffect(() => {
    const severities = ['success', 'error', 'warning', 'info'] as const
    const alerts = severities
      .filter((severity) => flashMessages?.[severity]?.message)
      .map((severity) => ({
        severity,
        message: flashMessages[severity].message,
      }))

    if (alerts.length > 0) {
      toast(<Toast alerts={alerts} />, {
        closeButton: false,
        style: { padding: 0, background: 'transparent', boxShadow: 'none' },
      })
    }
  }, [flashMessages])

  return (
    <div
      className={`flex flex-col ${isMapLayout ? 'h-screen overflow-hidden' : 'min-h-screen'}`}
      style={{ backgroundColor: fr.colors.decisions.background.default.grey.default }}
    >
      <Header
        brandTop={
          <>
            RÉPUBLIQUE
            <br />
            FRANÇAISE
          </>
        }
        homeLinkProps={{
          href: '/accueil',
          title: 'Viz’Eau',
        }}
        serviceTitle="Viz’Eau"
        navigation={
          isLoginPage
            ? []
            : [
                {
                  linkProps: { href: '/accueil' },
                  text: 'Accueil',
                  isActive: pathname === '/accueil',
                },
                {
                  linkProps: { href: '/exploitations' },
                  text: 'Exploitations agricoles',
                  isActive: pathname.startsWith('/exploitations'),
                },
                {
                  linkProps: { href: '/aac' },
                  text: 'AAC',
                  isActive: pathname.startsWith('/aac'),
                },
                {
                  linkProps: { href: '/projets' },
                  text: 'Projets',
                  isActive: pathname.startsWith('/projets'),
                },
                {
                  linkProps: { href: '/visualisation' },
                  text: 'Visualisation',
                  isActive: pathname.startsWith('/visualisation'),
                },
              ]
        }
        quickAccessItems={
          isLoginPage
            ? []
            : [
                <Button
                  iconId="fr-icon-account-circle-fill"
                  className="fr-text--sm fr-m-0"
                  priority="tertiary no outline"
                  linkProps={{
                    href: '/logout',
                  }}
                >
                  Déconnexion
                </Button>,
              ]
        }
      />
      <main className={`flex flex-col flex-1 ${isMapLayout ? 'overflow-hidden' : ''}`}>
        {children}
      </main>
      {!hideFooter && (
        <Footer
          accessibility="fully compliant"
          bottomItems={[headerFooterDisplayItem]}
          contentDescription=""
        />
      )}
    </div>
  )
}
