import { useEffect, useState } from 'react'
import { fr } from '@codegouvfr/react-dsfr'
import 'chartjs-adapter-date-fns'
import {
  Chart as ChartJS,
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Chart } from 'react-chartjs-2'
import Loader from '~/ui/Loader'

ChartJS.register(TimeScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

// ─── Types ────────────────────────────────────────────────────────────────────

type Substance = {
  code_parametre: number
  libelle_parametre: string
  code_unite: string
  has_dep: boolean
}

type ChroniqeData = {
  info: {
    code_parametre: number
    libelle_parametre: string
    code_unite: string
    seuil_regl: number | null
    seuil_alerte: number | null
  }
  stats: {
    moyenne: number
    maximum: number
    nb_total: number
    nb_dep_regl: number
    frequence_dep_regl: number
  }
  series: Array<{ date: string; valeur: number; statut: 'conforme' | 'dep_alerte' | 'dep_regl' }>
}

type Props = {
  aacCode: string
  installationCode: string
  yearMin: number
  yearMax: number
}

// ─── Scatter chart ────────────────────────────────────────────────────────────

function formatUnite(code: string): string {
  return code === 'SANS OBJET' ? '' : code
}

function SubstanceScatterChart({ data }: { data: ChroniqeData }) {
  const { info, series } = data
  const unite = formatUnite(info.code_unite)

  const toTs = (d: string) => new Date(d).getTime()
  const allTs = series.map((p) => toTs(p.date))
  const minTs = Math.min(...allTs)
  const maxTs = Math.max(...allTs)
  // pad bounds slightly so threshold lines extend slightly past first/last point
  const padMs = (maxTs - minTs) * 0.02

  const conformes = series.filter((p) => p.statut === 'conforme')
  const depAlerte = series.filter((p) => p.statut === 'dep_alerte')
  const depRegl = series.filter((p) => p.statut === 'dep_regl')

  const pointDs = (
    label: string,
    points: typeof series,
    color: string
  ): ChartJS.ChartDataset<'scatter'> => ({
    type: 'scatter' as const,
    label,
    data: points.map((p) => ({ x: toTs(p.date), y: p.valeur })),
    backgroundColor: color,
    pointRadius: 5,
    pointHoverRadius: 7,
  })

  const lineDs = (label: string, y: number, color: string): ChartJS.ChartDataset<'line'> => ({
    type: 'line' as const,
    label,
    data: [
      { x: minTs - padMs, y },
      { x: maxTs + padMs, y },
    ],
    borderColor: color,
    borderDash: [6, 3],
    borderWidth: 2,
    pointRadius: 0,
    fill: false,
  })

  const datasets: ChartJS.ChartDataset[] = [
    pointDs('Conforme', conformes, '#003189'),
    pointDs('Au dessus du seuil réglementaire', depRegl, '#D40000'),
    pointDs("Au dessus du seuil d'alerte", depAlerte, '#E18B00'),
    ...(info.seuil_regl !== null
      ? [lineDs(`Seuil réglementaire (${info.seuil_regl} ${unite})`, info.seuil_regl, '#D40000')]
      : []),
    ...(info.seuil_alerte !== null
      ? [lineDs(`Seuil d'alerte (${info.seuil_alerte} ${unite})`, info.seuil_alerte, '#E18B00')]
      : []),
  ]

  const options: ChartJS.ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'time',
        time: { unit: 'year', displayFormats: { year: 'yyyy' } },
        title: { display: false },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: `Concentration (${unite})`,
          font: { size: 12 },
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        align: 'start' as const,
        labels: { boxWidth: 12, boxHeight: 12, font: { size: 12 } },
      },
      tooltip: {
        backgroundColor: '#fff',
        titleColor: '#000',
        bodyColor: '#000',
        borderColor: 'rgba(0,0,0,0.1)',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          title: (items) => {
            const ts = items[0]?.parsed?.x
            if (!ts) return ''
            return new Date(ts).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })
          },
          label: (ctx) => {
            const dsLabel = ctx.dataset.label ?? ''
            const y = ctx.parsed?.y
            if (y === undefined) return dsLabel
            return `${dsLabel} : ${y} ${unite}`
          },
        },
      },
    },
  }

  return (
    <div style={{ height: 320 }}>
      <Chart type="scatter" data={{ datasets }} options={options} />
    </div>
  )
}

// ─── Mini stat box ─────────────────────────────────────────────────────────────

function MiniStatBox({
  label,
  value,
  iconId,
  color,
}: {
  label: string
  value: string
  iconId: string
  color: string
}) {
  return (
    <div
      className="fr-p-2w flex flex-col gap-2"
      style={{
        border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
      }}
    >
      <div className="flex items-center gap-1">
        <span className={`${iconId} fr-icon--sm`} aria-hidden="true" style={{ color }} />
        <span
          className="fr-text--xs fr-mb-0"
          style={{ color: fr.colors.decisions.text.mention.grey.default }}
        >
          {label}
        </span>
      </div>
      <p className="fr-h4 fr-mb-0" style={{ color }}>
        {value}
      </p>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ChroniquesParSubstances({
  aacCode,
  installationCode,
  yearMin,
  yearMax,
}: Props) {
  const [substances, setSubstances] = useState<Substance[]>([])
  const [selectedCode, setSelectedCode] = useState<number | null>(null)
  const [chronique, setChronique] = useState<ChroniqeData | null>(null)
  const [loadingSubstances, setLoadingSubstances] = useState(true)
  const [loadingChronique, setLoadingChronique] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load substances list when year range changes
  useEffect(() => {
    const controller = new AbortController()
    setLoadingSubstances(true)
    setSubstances([])
    setSelectedCode(null)
    setChronique(null)

    fetch(
      `/aac/${aacCode}/installations/${installationCode}/analyses/substances?yearMin=${yearMin}&yearMax=${yearMax}`,
      { signal: controller.signal }
    )
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<Substance[]>
      })
      .then((data) => {
        setSubstances(data)
        if (data.length > 0) setSelectedCode(data[0].code_parametre)
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError('Impossible de charger les substances.')
      })
      .finally(() => setLoadingSubstances(false))

    return () => controller.abort()
  }, [aacCode, installationCode, yearMin, yearMax])

  // Load chronique when substance selection changes
  useEffect(() => {
    if (selectedCode === null) return

    const controller = new AbortController()
    setLoadingChronique(true)
    setChronique(null)

    fetch(
      `/aac/${aacCode}/installations/${installationCode}/analyses/substances/${selectedCode}?yearMin=${yearMin}&yearMax=${yearMax}`,
      { signal: controller.signal }
    )
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<ChroniqeData>
      })
      .then(setChronique)
      .catch((err) => {
        if (err.name !== 'AbortError') setError('Impossible de charger la chronique.')
      })
      .finally(() => setLoadingChronique(false))

    return () => controller.abort()
  }, [aacCode, installationCode, selectedCode, yearMin, yearMax])

  if (error) {
    return (
      <div className="fr-alert fr-alert--error fr-alert--sm">
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Substance selector */}
      <div className="flex flex-col gap-1" style={{ maxWidth: 320 }}>
        <label
          className="fr-text--sm fr-mb-0"
          style={{ fontWeight: 600 }}
          htmlFor="substance-select"
        >
          Sélectionnez une substance
        </label>
        {loadingSubstances ? (
          <Loader type="dots" size="sm" />
        ) : (
          <div className="fr-select-group" style={{ marginBottom: 0 }}>
            <select
              id="substance-select"
              className="fr-select"
              value={selectedCode ?? ''}
              onChange={(e) => setSelectedCode(Number(e.target.value))}
            >
              {substances.map((s) => (
                <option key={s.code_parametre} value={s.code_parametre}>
                  {s.libelle_parametre}
                  {s.has_dep ? ' ⚠' : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Detail panels */}
      {loadingChronique && (
        <div className="flex items-center gap-2 fr-py-2w">
          <Loader type="dots" size="sm" />
        </div>
      )}

      {!loadingChronique && chronique && (
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
              {formatUnite(chronique.info.code_unite) && (
                <p className="fr-text--sm fr-mb-0">
                  <span style={{ color: fr.colors.decisions.text.mention.grey.default }}>
                    Unité :{' '}
                  </span>
                  <strong>{formatUnite(chronique.info.code_unite)}</strong>
                </p>
              )}
            </div>

            {(chronique.info.seuil_regl !== null || chronique.info.seuil_alerte !== null) && (
              <div className="flex flex-col gap-1">
                <p
                  className="fr-text--sm fr-mb-1v"
                  style={{
                    fontWeight: 700,
                    color: fr.colors.decisions.text.mention.grey.default,
                    textTransform: 'uppercase',
                    fontSize: 11,
                    letterSpacing: '0.05em',
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
                      {chronique.info.seuil_regl} {formatUnite(chronique.info.code_unite)}
                    </strong>
                  </p>
                )}
                {chronique.info.seuil_alerte !== null && (
                  <p className="fr-text--sm fr-mb-0">
                    <span style={{ color: fr.colors.decisions.text.mention.grey.default }}>
                      Seuil d'alerte :{' '}
                    </span>
                    <strong>
                      {chronique.info.seuil_alerte} {formatUnite(chronique.info.code_unite)}
                    </strong>
                  </p>
                )}
              </div>
            )}

            {/* Dépassement box */}
            <div
              className="fr-p-2w flex flex-col gap-1"
              style={{
                border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
                marginTop: 4,
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="fr-icon-warning-line fr-icon--sm"
                  aria-hidden="true"
                  style={{ color: fr.colors.decisions.text.default.warning.default }}
                />
                <span className="fr-text--sm fr-mb-0" style={{ fontWeight: 700 }}>
                  Dépassement réglementaire
                </span>
              </div>
              <p
                className="fr-h4 fr-mb-0"
                style={{
                  color:
                    chronique.stats.nb_dep_regl > 0
                      ? fr.colors.decisions.text.default.error.default
                      : fr.colors.decisions.text.default.grey.default,
                }}
              >
                {chronique.stats.frequence_dep_regl.toLocaleString('fr-FR')}%
              </p>
            </div>
          </div>

          {/* Right: Résultats + chart */}
          <div className="flex flex-col gap-3">
            <h6 className="fr-text--md fr-mb-0" style={{ fontWeight: 700 }}>
              <span className="fr-icon-account-line fr-icon--sm fr-mr-1v" aria-hidden="true" />
              Résultat des prélèvements sur la période
            </h6>

            <div className="grid grid-cols-2 gap-2">
              <MiniStatBox
                label="Moyenne de concentration"
                value={`${chronique.stats.moyenne.toLocaleString('fr-FR')} ${formatUnite(chronique.info.code_unite)}`}
                iconId="fr-icon-line-chart-line"
                color={fr.colors.decisions.text.label.blueFrance.default}
              />
              <MiniStatBox
                label="Maximum des concentrations observés"
                value={`${chronique.stats.maximum.toLocaleString('fr-FR')} ${formatUnite(chronique.info.code_unite)}`}
                iconId="fr-icon-warning-line"
                color={fr.colors.decisions.text.default.warning.default}
              />
              <MiniStatBox
                label="Résultats en dépassement"
                value={chronique.stats.nb_dep_regl.toLocaleString('fr-FR')}
                iconId="fr-icon-error-line"
                color={
                  chronique.stats.nb_dep_regl > 0
                    ? fr.colors.decisions.text.default.error.default
                    : fr.colors.decisions.text.default.grey.default
                }
              />
              <MiniStatBox
                label="Fréquence de dépassement"
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
      )}
    </div>
  )
}
