import { useState } from 'react'
import { fr } from '@codegouvfr/react-dsfr'
import Button from '@codegouvfr/react-dsfr/Button'
import ResumeCard from '~/ui/ResumeCard'
import Loader from '~/ui/Loader'
import Divider from '~/ui/Divider'
import type { ChroniqueData } from '#types/captage'
import { formatUnite, SubstanceScatterChart } from './substance-scatter-chart'
import LabelInfo from '~/ui/LabelInfo'

type Props = {
  chronique: ChroniqueData | null
  loading?: boolean
  headerContent?: React.ReactNode
}

export function SubstanceDetail({ chronique, loading, headerContent }: Props) {
  const unite = chronique ? formatUnite(chronique.info.code_unite) : ''
  const [leftOpen, setLeftOpen] = useState(true)

  return (
    <div
      className="grid w-full overflow-hidden"
      style={{
        border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
        gridTemplateColumns: leftOpen ? '260px 1fr' : '0px 1fr',
        transition: 'grid-template-columns 0.2s ease',
      }}
    >
      {/* Left Sidebar: Informations générales */}
      <div
        className="overflow-hidden"
        style={{
          borderRight: leftOpen
            ? `1px solid ${fr.colors.decisions.border.default.grey.default}`
            : 'none',
        }}
      >
        <div style={{ width: 260 }}>
          <div
            className="flex items-center fr-pl-2v h-16"
            style={{ background: fr.colors.decisions.background.alt.blueFrance.default }}
          >
            <h6 className="fr-text--md font-medium fr-m-0 w-full fr-pr-2v">
              Informations générales
            </h6>
            <Button
              iconId="fr-icon-arrow-left-s-line"
              priority="tertiary no outline"
              onClick={() => setLeftOpen(false)}
              title="Fermer le panneau"
            />
          </div>

          {chronique && (
            <div className="flex flex-col gap-3 fr-p-2w">
              <div className="flex flex-col gap-1">
                <LabelInfo label="Code SANDRE" info={chronique.info.code_parametre} />
                {unite && <LabelInfo label="Unité" info={unite} />}
              </div>

              {(chronique.info.seuil_regl !== null || chronique.info.seuil_alerte !== null) && (
                <div className="flex flex-col gap-3">
                  <Divider label=" Seuils" />
                  <div className="flex flex-col gap-1">
                    {chronique.info.seuil_regl !== null && (
                      <LabelInfo
                        label="Seuil réglementaire"
                        info={`${chronique.info.seuil_regl} ${unite}`}
                      />
                    )}
                    {chronique.info.seuil_alerte !== null && (
                      <LabelInfo
                        label="Seuil d'alerte"
                        info={`${chronique.info.seuil_alerte} ${unite}`}
                      />
                    )}
                  </div>
                </div>
              )}
              <ResumeCard
                size="sm"
                title="Dépassement réglementaire"
                value={`${chronique.stats.frequence_dep_regl.toLocaleString('fr-FR')}%`}
                iconId="fr-icon-warning-line"
                color={
                  chronique.stats.nb_dep_regl > 0
                    ? fr.colors.decisions.text.default.error.default
                    : fr.colors.decisions.text.default.grey.default
                }
              />
            </div>
          )}
        </div>
      </div>

      {/* Center: Header + Content */}
      <div className="min-w-0 overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center fr-p-2v h-16"
          style={{ background: fr.colors.decisions.background.alt.blueFrance.default }}
        >
          {!leftOpen && (
            <Button
              iconId="fr-icon-arrow-right-s-line"
              priority="tertiary no outline"
              onClick={() => setLeftOpen(true)}
              title="Ouvrir le panneau gauche"
            />
          )}
          <div className="flex flex-1 fr-px-2v justify-end">{headerContent}</div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center gap-2 fr-py-2w fr-px-2w">
            <Loader type="dots" size="sm" />
          </div>
        ) : chronique ? (
          <div className="flex flex-col gap-3 fr-p-2w">
            <h6 className="fr-text--md fr-mb-0" style={{ fontWeight: 700 }}>
              <span className="fr-icon-microscope-line fr-icon--sm fr-mr-1v" aria-hidden="true" />
              Résultat des prélèvements sur la période
            </h6>

            <div className="grid grid-cols-2 gap-2">
              <ResumeCard
                size="sm"
                title="Moyenne de concentration"
                value={`${chronique.stats.moyenne.toLocaleString('fr-FR')} ${unite}`}
                iconId="fr-icon-line-chart-line"
                color={fr.colors.decisions.text.label.blueFrance.default}
              />
              <ResumeCard
                size="sm"
                title="Maximum des concentrations observés"
                value={`${chronique.stats.maximum.toLocaleString('fr-FR')} ${unite}`}
                iconId="fr-icon-warning-line"
                color={fr.colors.decisions.text.default.warning.default}
              />
              <ResumeCard
                size="sm"
                title="Résultats en dépassement"
                value={chronique.stats.nb_dep_regl.toLocaleString('fr-FR')}
                iconId="fr-icon-error-line"
                color={
                  chronique.stats.nb_dep_regl > 0
                    ? fr.colors.decisions.text.default.error.default
                    : fr.colors.decisions.text.default.grey.default
                }
              />
              <ResumeCard
                size="sm"
                title="Fréquence de dépassement"
                value={`${chronique.stats.frequence_dep_regl.toLocaleString('fr-FR')}%`}
                iconId="fr-icon-error-line"
                color={
                  chronique.stats.frequence_dep_regl > 0
                    ? fr.colors.decisions.text.default.error.default
                    : fr.colors.decisions.text.default.grey.default
                }
              />
            </div>

            {chronique.series.length > 0 ? (
              <SubstanceScatterChart data={chronique} />
            ) : (
              <p
                className="fr-text--sm fr-mb-0"
                style={{ color: fr.colors.decisions.text.mention.grey.default }}
              >
                Aucune mesure disponible pour cette période.
              </p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}
