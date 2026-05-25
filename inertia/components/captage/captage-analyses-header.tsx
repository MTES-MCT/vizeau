import { useState, useEffect } from 'react'
import { fr } from '@codegouvfr/react-dsfr'
import Loader from '~/ui/Loader'
import ResumeCard from '~/ui/ResumeCard'
import { SegmentedControl } from '@codegouvfr/react-dsfr/SegmentedControl'
import ChroniquesParSubstances from './chroniques-par-substances'
import DualRangeSlider from './dual-range-slider'
import { useFetch } from '~/hooks/use-fetch'
import type { AnalysesStats, AnalysesPerYear } from '#types/captage'
import QualiteSuivi from './qualite-suivi'
import SubstancesARisque from './substances-risque'

type Props = {
  aacCode: string
  installationCode: string
}

export default function CaptageAnalysesHeader({ aacCode, installationCode }: Props) {
  const [sliderMin, setSliderMin] = useState<number | null>(null)
  const [sliderMax, setSliderMax] = useState<number | null>(null)
  const [yearMin, setYearMin] = useState<number | null>(null)
  const [yearMax, setYearMax] = useState<number | null>(null)
  const [activeSection, setActiveSection] = useState<'suivi' | 'chroniques' | 'substances'>('suivi')
  const [chroniquesSubstanceCode, setChroniquesSubstanceCode] = useState<number | null>(null)
  const [scrollTarget, setScrollTarget] = useState<string | null>(null)

  useEffect(() => {
    if (activeSection === 'substances' && scrollTarget) {
      const el = document.getElementById(scrollTarget)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        setScrollTarget(null)
      }
    }
  }, [activeSection, scrollTarget])

  function goToChronique(code: number) {
    setChroniquesSubstanceCode(code)
    setActiveSection('chroniques')
  }

  const baseUrl = `/aac/${aacCode}/installations/${installationCode}/analyses`
  const yearParams =
    yearMin !== null && yearMax !== null ? `?yearMin=${yearMin}&yearMax=${yearMax}` : null

  const {
    data: years,
    loading: loadingYears,
    error: errorYears,
  } = useFetch<string[]>(
    `${baseUrl}/years`,
    'Impossible de charger les années disponibles.',
    (data) => {
      const nums = data.map(Number).sort((a, b) => a - b)
      if (nums.length > 0) {
        setSliderMin(nums[0])
        setSliderMax(nums[nums.length - 1])
        setYearMin(nums[0])
        setYearMax(nums[nums.length - 1])
      }
    }
  )

  const {
    data: stats,
    loading: loadingStats,
    error: errorStats,
  } = useFetch<AnalysesStats>(
    yearParams ? `${baseUrl}/stats${yearParams}` : null,
    'Impossible de charger les statistiques.'
  )

  const {
    data: perYearData,
    loading: loadingPerYear,
    error: errorPerYear,
  } = useFetch<AnalysesPerYear[]>(
    yearParams ? `${baseUrl}/per-year${yearParams}` : null,
    'Impossible de charger les données par année.'
  )

  const yearNums = years?.map(Number).sort((a, b) => a - b) ?? []
  const error = errorYears ?? errorStats ?? errorPerYear

  if (loadingYears) {
    return (
      <div className="flex items-center gap-2 fr-py-3w">
        <Loader type="dots" size="sm" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="fr-alert fr-alert--error fr-alert--sm">
        <p>{error}</p>
      </div>
    )
  }

  if (yearNums.length === 0) {
    return (
      <p
        className="fr-text--sm fr-mb-0"
        style={{ color: fr.colors.decisions.text.mention.grey.default }}
      >
        Aucune analyse disponible pour ce point de captage.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Year range selector + stat boxes */}
      <section
        style={{
          backgroundColor: fr.colors.decisions.background.alt.blueFrance.default,
          padding: 16,
        }}
      >
        <h6 className="fr-text--md fr-mb-1w" style={{ fontWeight: 700 }}>
          Périodes d'analyses
        </h6>
        <p
          className="fr-text--sm fr-mb-3w"
          style={{ color: fr.colors.decisions.text.mention.grey.default }}
        >
          Sélectionner une période pour consulter les résultats d'analyse de l'eau
        </p>
        {sliderMin !== null && sliderMax !== null && (
          <DualRangeSlider
            years={yearNums}
            valueMin={sliderMin}
            valueMax={sliderMax}
            onChange={(min, max) => {
              setSliderMin(min)
              setSliderMax(max)
            }}
            onCommit={(min, max) => {
              setYearMin(min)
              setYearMax(max)
            }}
          />
        )}

        {/* Stats boxes: 2 on top, 1 bottom-left */}
        <div className="grid grid-cols-2 gap-3 fr-mt-3w">
          <ResumeCard
            title="Dépassements réglementaires"
            iconId="fr-icon-error-line"
            color={fr.colors.decisions.text.default.error.default}
            value={
              loadingStats
                ? null
                : (stats?.depassements_reglementaires?.toLocaleString('fr-FR') ?? null)
            }
            label={
              stats?.depassements_reglementaires
                ? 'cliquer pour voir les substances →'
                : 'au total sur la période'
            }
            onClick={() => {
              if (stats?.depassements_reglementaires) {
                setActiveSection('substances')
                setScrollTarget('substances-regl')
              }
            }}
          />
          <ResumeCard
            title="Dépassements d'alerte (80 %)"
            iconId="fr-icon-error-warning-line"
            color={fr.colors.decisions.text.default.warning.default}
            value={
              loadingStats ? null : (stats?.depassements_alerte?.toLocaleString('fr-FR') ?? null)
            }
            label={
              stats?.depassements_reglementaires
                ? 'cliquer pour voir les substances →'
                : 'au total sur la période'
            }
            onClick={() => {
              if (stats?.depassements_alerte) {
                setActiveSection('substances')
                setScrollTarget('substances-alerte')
              }
            }}
          />
          <ResumeCard
            title="Analyses"
            iconId="fr-icon-microscope-line"
            color={fr.colors.decisions.text.label.blueFrance.default}
            value={loadingStats ? null : (stats?.total?.toLocaleString('fr-FR') ?? null)}
            label="au total sur la période"
          />
        </div>
      </section>

      {/* Section tabs */}
      <div className="flex flex-col gap-4 fr-mt-3w">
        <SegmentedControl
          hideLegend
          segments={[
            {
              label: 'Substances à risque',
              nativeInputProps: {
                checked: activeSection === 'substances',
                onChange: () => setActiveSection('substances'),
              },
            },
            {
              label: "Suivi de la qualité de l'eau",
              nativeInputProps: {
                checked: activeSection === 'suivi',
                onChange: () => setActiveSection('suivi'),
              },
            },
            {
              label: 'Chroniques par substances',
              nativeInputProps: {
                checked: activeSection === 'chroniques',
                onChange: () => setActiveSection('chroniques'),
              },
            },
          ]}
        />

        <div>
          {activeSection === 'suivi' && (
            <QualiteSuivi
              perYearData={perYearData}
              installationCode={installationCode}
              loadingPerYear={loadingPerYear}
            />
          )}

          {activeSection === 'substances' && yearMin !== null && yearMax !== null && (
            <SubstancesARisque
              aacCode={aacCode}
              installationCode={installationCode}
              yearMin={yearMin}
              yearMax={yearMax}
              onSelectSubstance={goToChronique}
            />
          )}

          {activeSection === 'chroniques' && yearMin !== null && yearMax !== null && (
            <ChroniquesParSubstances
              aacCode={aacCode}
              installationCode={installationCode}
              yearMin={yearMin}
              yearMax={yearMax}
              initialSubstanceCode={chroniquesSubstanceCode}
            />
          )}
        </div>
      </div>
    </div>
  )
}
