import { Head } from '@inertiajs/react'
import { ButtonsGroup } from '@codegouvfr/react-dsfr/ButtonsGroup'
import TechnicalError from '@codegouvfr/react-dsfr/picto/TechnicalError'

import Layout from '~/ui/layouts/layout'

// Le message de l'erreur n'est volontairement pas affiché : il peut contenir des détails techniques
export default function ServerError(props: { error?: { status?: number } }) {
  const status = props.error?.status ?? 500
  const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL

  return (
    <Layout>
      <Head title="Erreur inattendue" />
      <div className="fr-container fr-my-7w fr-mt-md-12w fr-mb-md-10w">
        <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--middle fr-grid-row--center">
          <div className="fr-col-12 fr-col-md-6 fr-py-0">
            <h1>Erreur inattendue</h1>
            <p className="fr-text--sm fr-mb-3w">Erreur {status}</p>
            <p className="fr-text--lead fr-mb-3w">
              Désolé, le service rencontre un problème, nous travaillons pour le résoudre le plus
              rapidement possible.
            </p>
            <p className="fr-text--sm fr-mb-5w">
              Essayez de rafraîchir la page ou bien réessayez plus tard.
              {supportEmail && ' Si le problème persiste, n’hésitez pas à nous contacter.'}
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
            <TechnicalError fontSize="10rem" aria-hidden="true" />
          </div>
        </div>
      </div>
    </Layout>
  )
}
