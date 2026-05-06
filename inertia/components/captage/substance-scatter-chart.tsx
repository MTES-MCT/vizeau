import 'chartjs-adapter-date-fns'
import {
  Chart as ChartJS,
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  ScatterController,
  LineController,
  type ChartDataset,
  type ChartOptions,
} from 'chart.js'
import { Chart } from 'react-chartjs-2'
import type { ChroniqueData } from '#types/captage'

ChartJS.register(
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  ScatterController,
  LineController
)

export function formatUnite(code: string): string {
  return code === 'SANS OBJET' ? '' : code
}

export function SubstanceScatterChart({ data }: { data: ChroniqueData }) {
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
  ): ChartDataset<'scatter'> => ({
    type: 'scatter' as const,
    label,
    data: points.map((p) => ({ x: toTs(p.date), y: p.valeur })),
    backgroundColor: color,
    pointRadius: 5,
    pointHoverRadius: 7,
  })

  const lineDs = (label: string, y: number, color: string): ChartDataset<'line'> => ({
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

  const datasets: ChartDataset<'scatter' | 'line'>[] = [
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

  const options: ChartOptions = {
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
      <Chart type="scatter" data={{ datasets: datasets as any }} options={options} />
    </div>
  )
}
