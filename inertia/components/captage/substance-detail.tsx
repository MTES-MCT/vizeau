import { fr } from '@codegouvfr/react-dsfr'
import ResumeCard from '~/ui/ResumeCard'
import type { ChroniqueData } from '#types/captage'
import { formatUnite, SubstanceScatterChart } from './substance-scatter-chart'

export function SubstanceDetail({ chronique }: { chronique: ChroniqueData }) {
  const unite = formatUnite(chronique.info.code_unite)

  return (
    <div className="grid grid-cols-2 gap-4" style={{ alignItems: 'start' }}>
      {/* Left: Informations générales */}
      <div
        className="flex flex-col gap-3 fr-p-3w"
        style={{
          border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
        }}
      >
        <h6 className="fr-text--md fr-mb-0" style={{ fontWeight: 700 }}>
          <span className="fr-icon-list-unordered fr-icon--sm fr-mr-1v" aria-hidden="true" />
          Informations générales
        </h6>

        <div className="flex flex-col gap-1">
          <p className="fr-text--sm fr-mb-0">
            <span style={{ color: fr.colors.decisions.text.mention.grey.default }}>
              Code SANDRE :{' '}
            </span>
            <strong>{chronique.info.code_parametre}</strong>
          </p>
          {unite && (
            <p className="fr-text--sm fr-mb-0">
              <span style={{ color: fr.colors.decisions.text.mention.grey.default }}>Unité : </span>
              <strong>{unite}</strong>
            </p>
          )}
        </div>

        {(chronique.info.seuil_regl !== null || chronique.info.seuil_alerte !== null) && (
          <div className="flex flex-col gap-1">
            <hr className="fr-hr fr-mt-1w fr-mb-1w" />
            <p
              className="fr-text--md fr-mb-1v"
              style={{
                fontWeight: 700,
                color: fr.colors.decisions.text.mention.grey.default,
              }}
            >
              Seuils
            </p>
            {chronique.info.seuil_regl !== null && (
              <p className="fr-text--sm fr-mb-0">
                <span style={{ color: fr.colors.decisions.text.mention.grey.default }}>
                  Seuil réglementaire :{' '}
                </span>
                <strong>
                  {chronique.info.seuil_regl} {unite}
                </strong>
              </p>
            )}
            {chronique.info.seuil_alerte !== null && (
              <p className="fr-text--sm fr-mb-0">
                <span style={{ color: fr.colors.decisions.text.mention.grey.default }}>
                  Seuil d'alerte :{' '}
                </span>
                <strong>
                  {chronique.info.seuil_alerte} {unite}
                </strong>
              </p>
            )}
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

      {/* Right: Résultats + chart */}
      <div
        className="flex flex-col gap-3 fr-p-2w"
        style={{ border: `1px solid ${fr.colors.decisions.border.default.grey.default}` }}
      >
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
    </div>
  )
}
