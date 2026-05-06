import { Head } from '@inertiajs/react'
import { fr } from '@codegouvfr/react-dsfr'
import { InferPageProps } from '@adonisjs/inertia/types'
import Layout from '~/ui/layouts/layout'
import AacController from '#controllers/aac_controller'
import Breadcrumb from '@codegouvfr/react-dsfr/Breadcrumb'
import TruncatedText from '~/ui/TruncatedText'
import SmallSection from '~/ui/SmallSection'
import LabelInfo from '~/ui/LabelInfo'
import CaptageAnalysesHeader from '~/components/captage/captage-analyses-header'

export default function CaptageShow({
  aac,
  installation,
}: InferPageProps<AacController, 'showInstallation'>) {
  return (
    <Layout>
      <Head title={`${installation.nom} — Captage`} />
      <div
        className="fr-p-2w"
        style={{ backgroundColor: fr.colors.decisions.background.alt.blueFrance.default }}
      >
        <div className="fr-container flex justify-between items-center">
          <Breadcrumb
            currentPageLabel={
              <TruncatedText maxStringLength={50} hideTooltip>
                {installation.nom}
              </TruncatedText>
            }
            homeLinkProps={{
              href: '/accueil',
            }}
            segments={[
              {
                label: 'Liste des AAC',
                linkProps: { href: '/aac' },
              },
              {
                label: aac.nom,
                linkProps: { href: `/aac/${aac.code}?tab=captages` },
              },
            ]}
            className={'fr-my-0'}
          />
        </div>
      </div>

      <div className="fr-container fr-mt-4w fr-mb-4w">
        <h2 className="fr-h3 fr-mb-1w">{installation.nom}</h2>

        <section className="grid grid-cols-[350px_1fr] gap-4">
          <aside>
            <SmallSection
              title="Informations générales"
              iconId="fr-icon-drop-line"
              priority="secondary"
              hasBorder
            >
              <div className="flex flex-col gap-2">
                <LabelInfo label="Code BSS" info={installation.code_bss || 'Non renseigné'} />
                <LabelInfo
                  label="Commune"
                  info={
                    installation.commune
                      ? `${installation.commune} (${installation.departement})`
                      : 'Non renseignée'
                  }
                />
                <LabelInfo label="Type" info={installation.type || 'Non renseigné'} />
                <LabelInfo label="Nature" info={installation.nature || 'Non renseignée'} />
                <LabelInfo label="Usage" info={installation.usage || 'Non renseigné'} />
                <LabelInfo label="État" info={installation.etat || 'Non renseigné'} />
                {installation.code_ppe && (
                  <LabelInfo label="Code PPE" info={installation.code_ppe} />
                )}
                <LabelInfo
                  label="Prioritaire"
                  info={
                    installation.prioritaire === true
                      ? 'Oui'
                      : installation.prioritaire === false
                        ? 'Non'
                        : 'Non renseigné'
                  }
                />
                {installation.captages_rattaches && installation.captages_rattaches.length > 0 && (
                  <LabelInfo
                    label="Captages rattachés"
                    info={String(installation.captages_rattaches.length)}
                  />
                )}
              </div>
            </SmallSection>
          </aside>

          <div>
            <CaptageAnalysesHeader aacCode={aac.code} installationCode={installation.code} />
          </div>
        </section>
      </div>
    </Layout>
  )
}
