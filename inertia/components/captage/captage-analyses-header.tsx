import { useEffect, useRef, useState } from 'react'
import { fr } from '@codegouvfr/react-dsfr'
import Loader from '~/ui/Loader'
import VerticalChartBar from '~/ui/Charts/VerticalChartBar'
import ChroniquesParSubstances from './chroniques-par-substances'

type Stats = {
  total: number
  depassements_alerte: number
  depassements_reglementaires: number
}

type PerYearData = {
  annee: number
  total: number
  avec_dep: number
  sans_dep: number
}

type Props = {
  aacCode: string
  installationCode: string
}

// ─── Dual Range Slider ────────────────────────────────────────────────────────

function DualRangeSlider({
  years,
  valueMin,
  valueMax,
  onChange,
  onCommit,
}: {
  years: number[]
  valueMin: number
  valueMax: number
  onChange: (min: number, max: number) => void
  onCommit: (min: number, max: number) => void
}) {
  const min = years[0]
  const max = years[years.length - 1]
  const blue = fr.colors.decisions.border.default.blueFrance.default
  const grey = fr.colors.decisions.border.default.grey.default

  const toPercent = (val: number) => ((val - min) / (max - min || 1)) * 100
  const leftPct = toPercent(valueMin)
  const rightPct = toPercent(valueMax)

  // Refs track the latest pending values so onPointerUp/onKeyUp
  // always commit the most recent drag position without stale closures.
  const pendingMinRef = useRef(valueMin)
  const pendingMaxRef = useRef(valueMax)
  useEffect(() => {
    pendingMinRef.current = valueMin
  }, [valueMin])
  useEffect(() => {
    pendingMaxRef.current = valueMax
  }, [valueMax])

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.min(Number(e.target.value), pendingMaxRef.current)
    pendingMinRef.current = val
    onChange(val, pendingMaxRef.current)
  }
  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(Number(e.target.value), pendingMinRef.current)
    pendingMaxRef.current = val
    onChange(pendingMinRef.current, val)
  }
  const handleCommit = () => onCommit(pendingMinRef.current, pendingMaxRef.current)

  if (years.length === 1) {
    return (
      <p
        className="fr-text--sm fr-mb-0"
        style={{ color: fr.colors.decisions.text.mention.grey.default }}
      >
        {years[0]}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Selected range label */}
      <div className="flex justify-center">
        <span
          className="fr-text--sm fr-mb-0 fr-px-1w fr-py-0"
          style={{
            background: fr.colors.decisions.background.alt.blueFrance.default,
            color: fr.colors.decisions.text.label.blueFrance.default,
            fontWeight: 700,
            borderRadius: 4,
          }}
        >
          {valueMin === valueMax ? String(valueMin) : `${valueMin} – ${valueMax}`}
        </span>
      </div>

      {/* Track + thumbs */}
      <div style={{ position: 'relative', height: 24, margin: '0 8px' }}>
        {/* Background track */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            height: 4,
            background: grey,
            transform: 'translateY(-50%)',
            borderRadius: 2,
          }}
        >
          {/* Active range highlight */}
          <div
            style={{
              position: 'absolute',
              left: `${leftPct}%`,
              right: `${100 - rightPct}%`,
              height: '100%',
              background: blue,
              borderRadius: 2,
            }}
          />
        </div>

        {/* Min input */}
        <input
          type="range"
          aria-label="Année minimum"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={valueMin}
          aria-valuetext={String(valueMin)}
          min={min}
          max={max}
          step={1}
          value={valueMin}
          onChange={handleMinChange}
          onPointerUp={handleCommit}
          onKeyUp={handleCommit}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            top: 0,
            left: 0,
            WebkitAppearance: 'none',
            appearance: 'none',
            background: 'transparent',
            pointerEvents: 'none',
            zIndex: valueMin === valueMax ? 5 : 3,
          }}
          className="dual-range-thumb"
        />

        {/* Max input */}
        <input
          type="range"
          aria-label="Année maximum"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={valueMax}
          aria-valuetext={String(valueMax)}
          min={min}
          max={max}
          step={1}
          value={valueMax}
          onChange={handleMaxChange}
          onPointerUp={handleCommit}
          onKeyUp={handleCommit}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            top: 0,
            left: 0,
            WebkitAppearance: 'none',
            appearance: 'none',
            background: 'transparent',
            pointerEvents: 'none',
            zIndex: 4,
          }}
          className="dual-range-thumb"
        />
      </div>

      {/* Year labels */}
      <div className="flex justify-between">
        {years.map((year) => (
          <span
            key={year}
            className="fr-text--xs fr-mb-0"
            style={{
              color:
                year >= valueMin && year <= valueMax
                  ? fr.colors.decisions.text.label.blueFrance.default
                  : fr.colors.decisions.text.mention.grey.default,
              fontWeight: year === valueMin || year === valueMax ? 700 : 400,
            }}
          >
            {year}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Stat Box ─────────────────────────────────────────────────────────────────

function StatBox({
  label,
  iconId,
  iconColor,
  value,
  hasAlert,
}: {
  label: string
  iconId: string
  iconColor: string
  value: number | null
  hasAlert?: boolean
}) {
  return (
    <div
      className="flex flex-col gap-2 fr-p-2w"
      style={{
        border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
        backgroundColor: fr.colors.decisions.background.default.grey.default,
      }}
    >
      <div className="flex items-center gap-2">
        <span className={`${iconId} fr-icon--md`} aria-hidden="true" style={{ color: iconColor }} />
        <span className="fr-text--sm fr-mb-0" style={{ fontWeight: 600 }}>
          {label}
        </span>
      </div>

      <div className="flex items-end justify-between gap-2">
        <div>
          {value === null ? (
            <Loader type="dots" size="sm" />
          ) : (
            <>
              <p className="fr-h3 fr-mb-0">{value.toLocaleString('fr-FR')}</p>
              <p
                className="fr-text--xs fr-mb-0"
                style={{ color: fr.colors.decisions.text.mention.grey.default }}
              >
                au total sur la période
              </p>
            </>
          )}
        </div>

        {value !== null && hasAlert && value > 0 && (
          <span
            className="fr-badge fr-badge--sm fr-badge--error"
            aria-label={`${value} dépassement${value > 1 ? 's' : ''}`}
          >
            {value.toLocaleString('fr-FR')}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CaptageAnalysesHeader({ aacCode, installationCode }: Props) {
  const [years, setYears] = useState<number[]>([])
  const [sliderMin, setSliderMin] = useState<number | null>(null)
  const [sliderMax, setSliderMax] = useState<number | null>(null)
  const [yearMin, setYearMin] = useState<number | null>(null)
  const [yearMax, setYearMax] = useState<number | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [perYearData, setPerYearData] = useState<PerYearData[] | null>(null)
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
        return res.json() as Promise<Stats>
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
        return res.json() as Promise<PerYearData[]>
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
          <StatBox
            label="Dépassements d'alerte (80 %)"
            iconId="fr-icon-warning-line"
            iconColor={fr.colors.decisions.text.default.warning.default}
            value={loadingStats ? null : (stats?.depassements_alerte ?? null)}
            hasAlert
          />
          <StatBox
            label="Dépassements réglementaires"
            iconId="fr-icon-information-line"
            iconColor={fr.colors.decisions.text.label.blueFrance.default}
            value={loadingStats ? null : (stats?.depassements_reglementaires ?? null)}
            hasAlert
          />
          <StatBox
            label="Analyses"
            iconId="fr-icon-microscope-line"
            iconColor={fr.colors.decisions.text.label.blueFrance.default}
            value={loadingStats ? null : (stats?.total ?? null)}
          />
        </div>
      </section>

      {/* Section tabs */}
      <div
        style={{
          border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
        }}
      >
        <div
          className="fr-px-3w fr-py-2w"
          style={{ borderBottom: `1px solid ${fr.colors.decisions.border.default.grey.default}` }}
        >
          <div
            style={{
              display: 'flex',
              width: 'fit-content',
              border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
            }}
          >
            {(
              [
                { value: 'suivi', label: "Suivi de la qualité de l'eau" },
                { value: 'chroniques', label: 'Chroniques par substances' },
              ] as const
            ).map(({ value, label }, i) => (
              <button
                key={value}
                type="button"
                onClick={() => setActiveSection(value)}
                style={{
                  padding: '6px 16px',
                  fontSize: 14,
                  fontWeight: activeSection === value ? 700 : 400,
                  cursor: 'pointer',
                  border: 'none',
                  borderLeft:
                    i > 0 ? `1px solid ${fr.colors.decisions.border.default.grey.default}` : 'none',
                  backgroundColor:
                    activeSection === value
                      ? fr.colors.decisions.background.active.blueFrance.default
                      : fr.colors.decisions.background.default.grey.default,
                  color:
                    activeSection === value
                      ? '#fff'
                      : fr.colors.decisions.text.default.grey.default,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

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
                margin: '0 -24px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
                }}
              >
                {(['graphique', 'tableau'] as const).map((view, i) => (
                  <button
                    key={view}
                    type="button"
                    onClick={() => setActiveView(view)}
                    style={{
                      padding: '6px 16px',
                      fontSize: 14,
                      fontWeight: activeView === view ? 700 : 400,
                      cursor: 'pointer',
                      border: 'none',
                      borderLeft:
                        i > 0
                          ? `1px solid ${fr.colors.decisions.border.default.grey.default}`
                          : 'none',
                      backgroundColor:
                        activeView === view
                          ? fr.colors.decisions.background.active.blueFrance.default
                          : fr.colors.decisions.background.default.grey.default,
                      color:
                        activeView === view
                          ? '#fff'
                          : fr.colors.decisions.text.default.grey.default,
                    }}
                  >
                    {view.charAt(0).toUpperCase() + view.slice(1)}
                  </button>
                ))}
              </div>
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
  )
}
