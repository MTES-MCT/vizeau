import { fr } from '@codegouvfr/react-dsfr'
import { Table } from '@codegouvfr/react-dsfr/Table'
import Loader from '~/ui/Loader'
import type { SubstanceItem } from '#types/captage'
import { useFetch } from '~/hooks/use-fetch'
import SectionCard from '~/ui/SectionCard'

type Props = {
  aacCode: string
  installationCode: string
  yearMin: number
  yearMax: number
  onSelectSubstance: (code: number) => void
}

export default function SubstancesARisque({
  aacCode,
  installationCode,
  yearMin,
  yearMax,
  onSelectSubstance,
}: Props) {
  const baseUrl = `/aac/${aacCode}/installations/${installationCode}/analyses`
  const yearParams = `?yearMin=${yearMin}&yearMax=${yearMax}`

  const {
    data: substances,
    loading,
    error,
  } = useFetch<SubstanceItem[]>(
    `${baseUrl}/substances${yearParams}`,
    'Impossible de charger les substances.'
  )

  if (error) {
    return (
      <div className="fr-alert fr-alert--error fr-alert--sm">
        <p>{error}</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 fr-py-3w">
        <Loader type="dots" size="sm" />
      </div>
    )
  }

  // Exclude computed aggregate parameters (totals, sums) — these are not individual substances
  const isAggregate = (libelle: string) => {
    const lower = libelle.toLowerCase()
    return lower.startsWith('total') || lower.startsWith('somme') || lower.startsWith('sum of')
  }

  const withDep = (substances ?? []).filter((s) => s.has_dep && !isAggregate(s.libelle_parametre))
  const withRegl = withDep.filter((s) => s.nb_dep_regl > 0)
  const withAlerteOnly = withDep.filter((s) => s.nb_dep_regl === 0 && s.nb_dep_alerte > 0)

  if (withDep.length === 0) {
    return (
      <p
        className="fr-text--sm fr-mb-0"
        style={{ color: fr.colors.decisions.text.mention.grey.default }}
      >
        Aucune substance en dépassement sur la période sélectionnée.
      </p>
    )
  }

  return (
    <SectionCard
      title="Substances à risque"
      caption="Substances présentant au moins un dépassement sur la période — cliquez pour voir la chronique détaillée."
      icon="fr-icon-warning-line"
    >
      <div className="flex flex-col gap-2">
        {withRegl.length > 0 && (
          <SubstanceTable
            id="substances-regl"
            title="Dépassements réglementaires"
            titleColor={fr.colors.decisions.text.default.error.default}
            substances={withRegl}
            onSelect={onSelectSubstance}
            type="regl"
          />
        )}

        {withAlerteOnly.length > 0 && (
          <SubstanceTable
            id="substances-alerte"
            title="Dépassements d'alerte uniquement (80 %)"
            titleColor={fr.colors.decisions.text.default.warning.default}
            substances={withAlerteOnly}
            onSelect={onSelectSubstance}
            type="alerte"
          />
        )}
      </div>
    </SectionCard>
  )
}

type TableProps = {
  title: string
  titleColor: string
  substances: SubstanceItem[]
  onSelect: (code: number) => void
  type: 'regl' | 'alerte'
  id?: string
}

function SubstanceTable({ title, titleColor, substances, onSelect, type, id }: TableProps) {
  return (
    <div id={id} className="flex flex-col">
      <p
        className="fr-text--lg fr-text--bold fr-mb-0"
        style={{ color: titleColor }}
        aria-hidden="true"
      >
        {title}
      </p>
      <Table
        headers={[
          'Substance',
          type === 'regl' ? 'Dép. régl.' : 'Dép. alerte',
          'Analyses',
          type === 'regl' ? 'Fréq. régl.' : 'Fréq. alerte',
          'Détail',
        ]}
        fixed
        className="w-full"
        data={substances.map((s) => {
          const depCount = type === 'regl' ? s.nb_dep_regl : s.nb_dep_alerte
          const freq =
            type === 'regl'
              ? s.frequence_dep_regl
              : Math.round((s.nb_dep_alerte / s.nb_total) * 1000) / 10
          return [
            s.libelle_parametre,
            <span style={{ fontWeight: 700, color: titleColor }}>
              {depCount.toLocaleString('fr-FR')}
            </span>,
            s.nb_total.toLocaleString('fr-FR'),
            <span style={{ color: freq > 0 ? titleColor : undefined }}>
              {freq.toLocaleString('fr-FR')} %
            </span>,
            <button
              type="button"
              className="fr-btn fr-btn--sm fr-btn--tertiary-no-outline fr-icon-line-chart-line fr-btn--icon-left"
              onClick={() => onSelect(s.code_parametre)}
              title={`Voir la chronique de ${s.libelle_parametre}`}
            >
              Chronique
            </button>,
          ]
        })}
      />
    </div>
  )
}
