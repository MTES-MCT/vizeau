import { Head } from '@inertiajs/react'
import { ButtonsGroup } from '@codegouvfr/react-dsfr/ButtonsGroup'
import TechnicalError from '@codegouvfr/react-dsfr/picto/TechnicalError'

import Layout from '~/ui/layouts/Layout'
import OvoidPictogram from '~/ui/OvoidPictogram'

export default function NotFound() {
  const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL

  return (
    <Layout>
      <Head title="Page non trouvée" />
      <div className="fr-container fr-my-7w fr-mt-md-12w fr-mb-md-10w">
        <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--middle fr-grid-row--center">
          <div className="fr-col-12 fr-col-md-6 fr-py-0">
            <h1>Page non trouvée</h1>
            <p className="fr-text--sm fr-mb-3w">Erreur 404</p>
            <p className="fr-text--lead fr-mb-3w">
              La page que vous cherchez est introuvable. Excusez-nous pour la gêne occasionnée.
            </p>
            <p className="fr-text--sm fr-mb-5w">
              Si vous avez tapé l’adresse web dans le navigateur, vérifiez qu’elle est correcte. La
              page n’est peut-être plus disponible : vous pouvez dans ce cas poursuivre votre
              navigation depuis la page d’accueil.
              {supportEmail &&
                ' Sinon, contactez-nous pour que nous puissions vous rediriger vers la bonne information.'}
            </p>
            <ButtonsGroup
              inlineLayoutWhen="md and up"
              buttons={[
                {
                  children: 'Page d’accueil',
                  linkProps: { href: '/' },
                },
                ...(supportEmail
                  ? [
                      {
                        children: 'Contacter le support',
                        priority: 'secondary' as const,
                        linkProps: { href: `mailto:${supportEmail}` },
                      },
                    ]
                  : []),
              ]}
            />
          </div>
          <div className="fr-col-12 fr-col-md-3 fr-col-offset-md-1 fr-px-6w fr-px-md-0 fr-py-0 flex justify-center">
            <OvoidPictogram pictogram={TechnicalError} />
          </div>
        </div>
      </div>
    </Layout>
  )
}
