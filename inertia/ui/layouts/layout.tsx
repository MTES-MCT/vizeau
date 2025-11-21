import { Button } from '@codegouvfr/react-dsfr/Button'
import { Header } from '@codegouvfr/react-dsfr/Header'
import { headerFooterDisplayItem } from '@codegouvfr/react-dsfr/Display'
import { Footer } from '@codegouvfr/react-dsfr/Footer'
import { fr } from '@codegouvfr/react-dsfr'
import { usePage } from '@inertiajs/react'

export default function Layout({
  children,
  hideFooter = false,
}: React.PropsWithChildren<{ hideFooter?: boolean }>) {
  const { url } = usePage()
  const pathname = url.split('?')[0]
  const isLoginPage = url === '/login'

  return (
    <div
      className="flex flex-col min-h-screen"
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
                  text: 'Exploitations',
                  isActive: pathname === '/exploitations' || pathname === '/exploitations/creation',
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
      <main className="flex flex-col flex-1">{children}</main>
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
