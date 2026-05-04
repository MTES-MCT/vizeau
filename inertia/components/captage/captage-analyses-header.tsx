import { useEffect, useState } from 'react'
import { fr } from '@codegouvfr/react-dsfr'
import Loader from '~/ui/Loader'
import ResumeCard from '~/ui/ResumeCard'
import { SegmentedControl } from '@codegouvfr/react-dsfr/SegmentedControl'
import VerticalChartBar from '~/ui/Charts/VerticalChartBar'
import ChroniquesParSubstances from './chroniques-par-substances'
import DualRangeSlider from './dual-range-slider'
import type { AnalysesStats, AnalysesPerYear } from '#types/captage'

type Props = {
  aacCode: string
  installationCode: string
}

export default function CaptageAnalysesHeader({ aacCode, installationCode }: Props) {
  const [years, setYears] = useState<number[]>([])
  const [sliderMin, setSliderMin] = useState<number | null>(null)
  const [sliderMax, setSliderMax] = useState<number | null>(null)
  const [yearMin, setYearMin] = useState<number | null>(null)
  const [yearMax, setYearMax] = useState<number | null>(null)
  const [stats, setStats] = useState<AnalysesStats | null>(null)
  const [perYearData, setPerYearData] = useState<AnalysesPerYear[] | null>(null)
  const [loadingYears, setLoadingYears] = useState(true)
  const [loadingStats, setLoadingStats] = useState(false)
  const [loadingPerYear, setLoadingPerYear] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<'suivi' | 'chroniques'>('suivi')
  const [activeView, setActiveView] = useState<'graphique' | 'tableau'>('graphique')

  // Fetch available years
  useEffect(() => {
    const controller = new AbortController()
    setLoadingYears(true)
    setError(null)

    fetch(`/aac/${aacCode}/installations/${installationCode}/analyses/years`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<string[]>
      })
      .then((data) => {
        const nums = data.map(Number).sort((a, b) => a - b)
        setYears(nums)
        if (nums.length > 0) {
          setSliderMin(nums[0])
          setSliderMax(nums[nums.length - 1])
          setYearMin(nums[0])
          setYearMax(nums[nums.length - 1])
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError('Impossible de charger les années disponibles.')
      })
      .finally(() => setLoadingYears(false))

    return () => controller.abort()
  }, [aacCode, installationCode])

  // Fetch stats when year range changes
  useEffect(() => {
    if (yearMin === null || yearMax === null) return

    const controller = new AbortController()
    setLoadingStats(true)
    setStats(null)
    setError(null)

    fetch(
      `/aac/${aacCode}/installations/${installationCode}/analyses/stats?yearMin=${yearMin}&yearMax=${yearMax}`,
      { signal: controller.signal }
    )
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<AnalysesStats>
      })
      .then(setStats)
      .catch((err) => {
        if (err.name !== 'AbortError') setError('Impossible de charger les statistiques.')
      })
      .finally(() => setLoadingStats(false))

    return () => controller.abort()
  }, [aacCode, installationCode, yearMin, yearMax])

  // Fetch per-year data when year range changes
  useEffect(() => {
    if (yearMin === null || yearMax === null) return

    const controller = new AbortController()
    setLoadingPerYear(true)
    setPerYearData(null)
    setError(null)

    fetch(
      `/aac/${aacCode}/installations/${installationCode}/analyses/per-year?yearMin=${yearMin}&yearMax=${yearMax}`,
      { signal: controller.signal }
    )
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<AnalysesPerYear[]>
      })
      .then(setPerYearData)
      .catch((err) => {
        if (err.name !== 'AbortError') setError('Impossible de charger les données par année.')
      })
      .finally(() => setLoadingPerYear(false))

    return () => controller.abort()
  }, [aacCode, installationCode, yearMin, yearMax])

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

  if (years.length === 0) {
    return (
      <p
        className="fr-text--sm fr-mb-0"
        style={{ color: fr.colors.decisions.text.mention.grey.default }}
      >
        Aucune analyse disponible pour ce point de captage.
      </p>
    )
  }

  const handleExportCsv = () => {
    if (!perYearData) return
    const header = 'Année,Conformes,En dépassement,Total'
    const rows = perYearData.map((d) => `${d.annee},${d.sans_dep},${d.avec_dep},${d.total}`)
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `qualite-eau-${installationCode}.csv`
    a.style.visibility = 'hidden'
    document.body.append(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const chartItems =
    perYearData && perYearData.length > 0
      ? {
          labels: perYearData.map((d) => String(d.annee)),
          datasets: [
            {
              label: 'Analyses conformes',
              data: perYearData.map((d) => d.sans_dep),
              backgroundColor: '#003189',
            },
            {
              label: 'Analyses en dépassement',
              data: perYearData.map((d) => d.avec_dep),
              backgroundColor: '#D40000',
            },
          ],
          tooltipExtras: [
            { label: "Nombre d'analyses", data: perYearData.map((d) => d.total) },
            { label: 'Dont en dépassement', data: perYearData.map((d) => d.avec_dep) },
            { label: 'Conformes', data: perYearData.map((d) => d.sans_dep) },
          ],
        }
      : null

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
            years={years}
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
            title="Dépassements d'alerte (80 %)"
            iconId="fr-icon-warning-line"
            color={fr.colors.decisions.text.default.warning.default}
            value={
              loadingStats ? null : (stats?.depassements_alerte?.toLocaleString('fr-FR') ?? null)
            }
            label="au total sur la période"
          />
          <ResumeCard
            title="Dépassements réglementaires"
            iconId="fr-icon-information-line"
            color={fr.colors.decisions.text.label.blueFrance.default}
            value={
              loadingStats
                ? null
                : (stats?.depassements_reglementaires?.toLocaleString('fr-FR') ?? null)
            }
            label="au total sur la période"
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
      <div>
        <div className="fr-px-3w fr-py-2w">
          <SegmentedControl
            hideLegend
            segments={[
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
        </div>

        <div style={{ border: `1px solid ${fr.colors.decisions.border.default.grey.default}` }}>
          {activeSection === 'suivi' && (
            <div className="fr-p-3w flex flex-col gap-4">
              <div className="flex items-start gap-2">
                <span
                  className="fr-icon-bar-chart-fill fr-icon--md"
                  aria-hidden="true"
                  style={{
                    color: fr.colors.decisions.text.label.blueFrance.default,
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                />
                <div>
                  <h6 className="fr-text--md fr-mb-1v" style={{ fontWeight: 700 }}>
                    Suivi de la qualité de l'eau
                  </h6>
                  <p
                    className="fr-text--sm fr-mb-0"
                    style={{ color: fr.colors.decisions.text.mention.grey.default }}
                  >
                    Consulter sur un nombre d'analyses données, l'évolution des dépassements par
                    années
                  </p>
                </div>
              </div>

              {/* Segmented control + exporter */}
              <div
                className="flex items-center justify-between fr-px-3w fr-py-2w"
                style={{
                  backgroundColor: fr.colors.decisions.background.alt.blueFrance.default,
                }}
              >
                <SegmentedControl
                  hideLegend
                  segments={[
                    {
                      label: 'Graphique',
                      nativeInputProps: {
                        checked: activeView === 'graphique',
                        onChange: () => setActiveView('graphique'),
                      },
                    },
                    {
                      label: 'Tableau',
                      nativeInputProps: {
                        checked: activeView === 'tableau',
                        onChange: () => setActiveView('tableau'),
                      },
                    },
                  ]}
                />
                <button
                  className="fr-btn fr-btn--sm fr-icon-download-line fr-btn--icon-left"
                  onClick={handleExportCsv}
                  disabled={!perYearData || perYearData.length === 0}
                  type="button"
                >
                  Exporter
                </button>
              </div>

              {/* Content */}
              {loadingPerYear ? (
                <div className="flex items-center gap-2 fr-py-3w">
                  <Loader type="dots" size="sm" />
                </div>
              ) : !perYearData || perYearData.length === 0 ? (
                <p
                  className="fr-text--sm fr-mb-0"
                  style={{ color: fr.colors.decisions.text.mention.grey.default }}
                >
                  Aucune donnée disponible pour cette période.
                </p>
              ) : activeView === 'graphique' ? (
                chartItems && (
                  <VerticalChartBar
                    chartItems={chartItems}
                    yAxisLabel="Nombre d'analyses"
                    unit="analyse(s)"
                    chartHeight={350}
                  />
                )
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr
                      style={{
                        backgroundColor: fr.colors.decisions.background.default.grey.default,
                        borderBottom: `2px solid ${fr.colors.decisions.border.default.grey.default}`,
                      }}
                    >
                      {['Année', 'Conformes', 'En dépassement', 'Total'].map((col) => (
                        <th
                          key={col}
                          scope="col"
                          style={{
                            padding: '10px 16px',
                            textAlign: 'left',
                            fontWeight: 700,
                            fontSize: 14,
                          }}
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {perYearData.map((d) => (
                      <tr
                        key={d.annee}
                        style={{
                          borderBottom: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
                        }}
                      >
                        <td style={{ padding: '10px 16px', fontSize: 14 }}>{d.annee}</td>
                        <td style={{ padding: '10px 16px', fontSize: 14 }}>
                          {d.sans_dep.toLocaleString('fr-FR')}
                        </td>
                        <td style={{ padding: '10px 16px', fontSize: 14 }}>
                          {d.avec_dep > 0 ? (
                            <span style={{ color: fr.colors.decisions.text.default.error.default }}>
                              {d.avec_dep.toLocaleString('fr-FR')}
                            </span>
                          ) : (
                            d.avec_dep.toLocaleString('fr-FR')
                          )}
                        </td>
                        <td style={{ padding: '10px 16px', fontSize: 14 }}>
                          {d.total.toLocaleString('fr-FR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeSection === 'chroniques' && yearMin !== null && yearMax !== null && (
            <div className="fr-p-3w">
              <ChroniquesParSubstances
                aacCode={aacCode}
                installationCode={installationCode}
                yearMin={yearMin}
                yearMax={yearMax}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
