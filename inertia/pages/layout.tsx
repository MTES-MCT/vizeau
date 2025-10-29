import { Box } from '@mui/material'
import { Header } from '@codegouvfr/react-dsfr/Header'
import { Footer } from '@codegouvfr/react-dsfr/Footer'

export default function Layout({
  children,
  hideFooter = false,
}: React.PropsWithChildren<{ hideFooter?: boolean }>) {
  return (
    <Box component="div" className="flex flex-col min-h-screen">
      <Header
        brandTop={
          <>
            RÉPUBLIQUE
            <br />
            FRANÇAISE
          </>
        }
        homeLinkProps={{
          href: '/',
          title: 'Viz’Eau',
        }}
        serviceTagline=""
        serviceTitle="Viz’Eau"
      />
      <Box component="main" className="flex-1">
        {children}
      </Box>
      {!hideFooter && (
        <Footer
          accessibility="fully compliant"
          contentDescription=""
          termsLinkProps={{
            href: '#',
          }}
          websiteMapLinkProps={{
            href: '#',
          }}
        />
      )}
    </Box>
  )
}
