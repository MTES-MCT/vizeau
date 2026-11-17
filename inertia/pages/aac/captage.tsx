import { Head } from '@inertiajs/react'
import { fr } from '@codegouvfr/react-dsfr'

import Layout from '~/ui/layouts/Layout'
import Breadcrumb from '@codegouvfr/react-dsfr/Breadcrumb'
import TruncatedText from '~/ui/TruncatedText'
import SmallSection from '~/ui/SmallSection'
import LabelInfo from '~/ui/LabelInfo'
import CaptageAnalysesHeader from '~/components/captage/captage-analyses-header'
import SignalErrorContact from '~/components/signal-error-contact'
import { Tag } from '@codegouvfr/react-dsfr/Tag'
import Badge from '@codegouvfr/react-dsfr/Badge'
import Tooltip from '@codegouvfr/react-dsfr/Tooltip'
import CustomTag from '~/ui/CustomTag'
import type { CaptageRattache, InstallationInfo } from '#types/aac'
import {
  getRecroisementMention,
  getSourceRattachementLabel,
  isInstallationAPart,
} from '~/functions/aac'

function CaptagesRattaches({ captages }: { captages: CaptageRattache[] }) {
  return (
    <ul className="flex flex-col gap-2 fr-p-0 fr-m-0">
      {captages.map((captage) => (
        <li key={captage.code} className="flex flex-col" style={{ listStyle: 'none' }}>
          <span className="fr-text--sm fr-mb-0 font-bold">{captage.nom}</span>
          <span
            className="fr-text--xs fr-mb-0"
            style={{ color: fr.colors.decisions.text.mention.grey.default }}
          >
            Code : {captage.code} · Ancien code BSS : {captage.code_bss || 'Non renseigné'} ·
            Nouveau code BSS : {captage.code_bss_nouveau || 'Non renseigné'}
          </span>
          {captage.etat && (
            <Badge
              small
              severity={captage.etat === 'ACTIF' ? 'success' : 'error'}
              as="span"
              className="fr-mt-1v"
            >
              {captage.etat}
            </Badge>
          )}
        </li>
      ))}
    </ul>
  )
}

export default function CaptageShow({
  aac,
  installation,
}: {
  aac: { code: string; nom: string }
  installation: InstallationInfo
}) {
  const recroisement = getRecroisementMention(installation)
  const sourceRattachement = getSourceRattachementLabel(installation)
  const captagesRattaches = installation.captages_rattaches ?? []

  return (
    <Layout>
      <Head title={`${installation.nom} — Point de prélèvement`} />
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
          <aside className="flex flex-col gap-4">
            <SmallSection
              title="Informations générales"
              iconId="fr-icon-pass-pending-line"
              priority="secondary"
              hasBorder
            >
              {installation.etat === 'ACTIF' && (
                <Tag
                  iconId="fr-icon-success-fill"
                  style={{
                    color: fr.colors.decisions.text.inverted.grey.default,
                    backgroundColor: fr.colors.decisions.background.flat.success.default,
                    marginBottom: '1rem',
                  }}
                >
                  Actif
                </Tag>
              )}

              {isInstallationAPart(installation) && installation.libelle_a_part && (
                <Badge severity="warning" className="fr-mb-2w">
                  {installation.libelle_a_part}
                </Badge>
              )}

              <div className="flex flex-col gap-2">
                <LabelInfo
                  label="Ancien code BSS"
                  info={installation.code_bss || 'Non renseigné'}
                />
                {/* Absent des fichiers antérieurs à novembre 2026 */}
                {installation.code_bss_nouveau !== undefined && (
                  <LabelInfo
                    label="Nouveau code BSS"
                    info={installation.code_bss_nouveau || 'Non renseigné'}
                  />
                )}
                <LabelInfo
                  label="Commune"
                  info={
                    installation.commune
                      ? `${installation.commune} (${installation.departement})`
                      : 'Non renseignée'
                  }
                />
                <LabelInfo
                  label="Type"
                  info={<CustomTag label={installation.type || 'Non renseigné'} />}
                />
                <LabelInfo label="Nature" info={installation.nature || 'Non renseignée'} />
                <LabelInfo label="Usage" info={installation.usage || 'Non renseigné'} />
                <LabelInfo label="État" info={installation.etat || 'Non renseigné'} />
                {installation.code_ppe && (
                  <LabelInfo label="Code PPE" info={installation.code_ppe} />
                )}

                {/* Statut dans l'AAC de la page : un captage peut être prioritaire dans une AAC
                    et pas dans une autre. NULL vaut « non prioritaire ». Un captage à part
                    (abandonné ou hors eau potable) n'est pas présenté comme prioritaire : son
                    motif suffit. */}
                {!isInstallationAPart(installation) && (
                  <LabelInfo label="Prioritaire" info={installation.prioritaire ? 'Oui' : 'Non'} />
                )}
                {sourceRattachement && (
                  <LabelInfo label="Origine du rattachement à l'AAC" info={sourceRattachement} />
                )}
                {recroisement && (
                  <div className="flex items-center gap-1">
                    <Badge small noIcon severity="info" as="span">
                      {recroisement.label}
                    </Badge>
                    <Tooltip kind="click" title={recroisement.description} />
                  </div>
                )}
              </div>
            </SmallSection>
            {captagesRattaches.length > 0 && (
              <SmallSection
                title={`Point${captagesRattaches.length > 1 ? 's' : ''} de prélèvement rattaché${captagesRattaches.length > 1 ? 's' : ''} (${captagesRattaches.length})`}
                iconId="fr-icon-links-line"
                priority="secondary"
                hasBorder
              >
                <p
                  className="fr-text--xs fr-mb-1w"
                  style={{ color: fr.colors.decisions.text.mention.grey.default }}
                >
                  Points de prélèvement qui puisent dans le même mélange que celui-ci.
                </p>
                <CaptagesRattaches captages={captagesRattaches} />
              </SmallSection>
            )}
            <SignalErrorContact />
          </aside>

          <div>
            <CaptageAnalysesHeader aacCode={aac.code} installationCode={installation.code} />
          </div>
        </section>
      </div>
    </Layout>
  )
}
