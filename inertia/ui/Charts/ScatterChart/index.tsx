import { Chart as ChartJS, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js'
import { Chart } from 'react-chartjs-2'

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend)

type DataPoint = {
  x: number
  y: number
  category: string
  tooltipTitle?: string
  tooltipMessage?: string
}

type Category = {
  label: string
  color: string
  pointRadius?: number
}

type Threshold = {
  value: number
  label: string
  color: string
  borderDash?: number[]
}

export type ScatterChartProps = {
  chartItems: DataPoint[]
  categories: Record<string, Category>
  thresholds?: Threshold[]
  yAxisLabel?: string
  unit?: string
  legendSize?: 'sm' | 'md' | 'lg'
  chartHeight?: number
  xAxisMin?: number
  xAxisMax?: number
}

export default function ScatterChart({
  chartItems,
  categories,
  thresholds = [],
  yAxisLabel = '',
  unit = '',
  legendSize = 'sm',
  chartHeight = 400,
  xAxisMin,
  xAxisMax,
}: ScatterChartProps) {
  const legendSizeMap = {
    sm: { box: 15, font: 12 },
    md: { box: 20, font: 16 },
    lg: { box: 25, font: 20 },
  }

  const xValues = chartItems.map((p) => p.x)
  const xMin = xAxisMin ?? (xValues.length > 0 ? Math.min(...xValues) : undefined)
  const xMax = xAxisMax ?? (xValues.length > 0 ? Math.max(...xValues) : undefined)

  const effectiveXMin =
    xMin !== undefined && xMax !== undefined && xMin === xMax ? xMin - 0.5 : xMin
  const effectiveXMax =
    xMin !== undefined && xMax !== undefined && xMin === xMax ? xMax + 0.5 : xMax

  const thresholdLineData = (t: Threshold) =>
    effectiveXMin !== undefined && effectiveXMax !== undefined
      ? [
          { x: effectiveXMin, y: t.value },
          { x: effectiveXMax, y: t.value },
        ]
      : []

  const scatterDatasets = Object.entries(categories).map(([key, cat]) => ({
    type: 'scatter' as const,
    label: cat.label,
    data: chartItems.filter((p) => p.category === key).map((p) => ({ x: p.x, y: p.y })),
    backgroundColor: cat.color,
    pointRadius: cat.pointRadius ?? 7,
    pointHoverRadius: (cat.pointRadius ?? 7) + 2,
  }))

  const thresholdDatasets = thresholds.map((t) => ({
    type: 'line' as const,
    label: t.label,
    data: thresholdLineData(t),
    borderColor: t.color,
    borderDash: t.borderDash ?? [6, 4],
    borderWidth: 2,
    backgroundColor: 'transparent',
    pointRadius: 0,
    pointHoverRadius: 0,
  }))

  const categoryKeys = Object.keys(categories)
  const pointsByDataset: DataPoint[][] = categoryKeys.map((key) =>
    chartItems.filter((p) => p.category === key)
  )

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'linear' as const,
        ...(effectiveXMin !== undefined ? { min: effectiveXMin } : {}),
        ...(effectiveXMax !== undefined ? { max: effectiveXMax } : {}),
        ticks: {
          stepSize: 1,
          callback: (val: number | string) => String(val),
        },
      },
      y: {
        beginAtZero: true,
        ...(yAxisLabel
          ? {
              title: {
                display: true,
                text: yAxisLabel,
                font: { size: 14, weight: 'bold' as const },
              },
            }
          : {}),
        ticks: {
          callback: (val: number | string) => `${val}${unit ? ` ${unit}` : ''}`,
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        align: 'start' as const,
        labels: {
          filter: (item: { datasetIndex: number }) =>
            item.datasetIndex < scatterDatasets.length + thresholds.length,
          boxWidth: legendSizeMap[legendSize].box,
          boxHeight: legendSizeMap[legendSize].box,
          font: { size: legendSizeMap[legendSize].font },
        },
      },
      tooltip: {
        backgroundColor: 'rgb(255, 255, 255)',
        titleColor: 'rgb(0, 0, 0)',
        bodyColor: 'rgb(220, 0, 0)',
        titleFont: { size: 16, weight: 'bold' as const },
        bodyFont: { size: 13, weight: 'bold' as const },
        padding: 12,
        titleMarginBottom: 8,
        borderColor: 'rgba(0, 0, 0, 0.15)',
        borderWidth: 1,
        filter: (item: { datasetIndex: number }) => item.datasetIndex < scatterDatasets.length,
        callbacks: {
          title: (items: { datasetIndex: number; dataIndex: number }[]) => {
            const { datasetIndex, dataIndex } = items[0] ?? {}
            const point = pointsByDataset[datasetIndex]?.[dataIndex]
            return point?.tooltipTitle ?? (point ? String(point.x) : '')
          },
          label: (item: { datasetIndex: number; dataIndex: number; raw: { y: number } }) => {
            const point = pointsByDataset[item.datasetIndex]?.[item.dataIndex]
            if (point?.tooltipMessage) return `● ${point.tooltipMessage}`
            const value = new Intl.NumberFormat('fr-FR').format(item.raw.y)
            return `${value}${unit ? ` ${unit}` : ''}`
          },
        },
      },
    },
  }

  return (
    <div style={{ height: `${chartHeight}px` }}>
      <Chart
        type="scatter"
        options={options as any}
        data={{ datasets: [...scatterDatasets, ...thresholdDatasets] }}
      />
    </div>
  )
}
