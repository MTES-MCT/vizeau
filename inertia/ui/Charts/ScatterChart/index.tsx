import { Chart as ChartJS, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js'
import { Chart } from 'react-chartjs-2'
import Badge from '@codegouvfr/react-dsfr/Badge'
import { useState } from 'react'

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend)

type BadgeSeverity = 'info' | 'success' | 'warning' | 'error' | 'new'

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
  badgeSeverity?: BadgeSeverity
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

type TooltipState = {
  x: number
  y: number
  title: string
  message?: string
  formattedValue: string
  severity?: BadgeSeverity
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

  const [tooltipState, setTooltipState] = useState<TooltipState | null>(null)

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
        enabled: false,
        external: ({ tooltip }: any) => {
          if (tooltip.opacity === 0) {
            setTooltipState(null)
            return
          }
          if (!tooltip.dataPoints?.length) {
            setTooltipState(null)
            return
          }
          const dp = tooltip.dataPoints[0]
          if (dp.datasetIndex >= scatterDatasets.length) {
            setTooltipState(null)
            return
          }
          const point = pointsByDataset[dp.datasetIndex]?.[dp.dataIndex]
          if (!point) return
          const cat = categories[point.category]
          const raw = new Intl.NumberFormat('fr-FR').format(point.y)
          setTooltipState({
            x: tooltip.caretX,
            y: tooltip.caretY,
            title: point.tooltipTitle ?? String(point.x),
            message: point.tooltipMessage,
            formattedValue: unit ? `${raw} ${unit}` : raw,
            severity: cat?.badgeSeverity,
          })
        },
      },
    },
  }

  return (
    <div style={{ position: 'relative', height: `${chartHeight}px` }}>
      <Chart
        type="scatter"
        options={options as any}
        data={{ datasets: [...scatterDatasets, ...thresholdDatasets] }}
      />
      {tooltipState && (
        <div
          style={{
            position: 'absolute',
            left: tooltipState.x,
            top: tooltipState.y,
            transform: 'translate(-50%, calc(-100% - 12px))',
            pointerEvents: 'none',
            background: 'white',
            border: '1px solid rgba(0,0,0,0.15)',
            borderRadius: 8,
            padding: '12px 16px',
            minWidth: 200,
            zIndex: 10,
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          }}
        >
          <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 16, color: '#000' }}>
            {tooltipState.title}
          </p>
          {tooltipState.message && tooltipState.severity ? (
            <Badge severity={tooltipState.severity}>{tooltipState.message}</Badge>
          ) : tooltipState.message ? (
            <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: 'rgb(220,0,0)' }}>
              ● {tooltipState.message}
            </p>
          ) : (
            <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: 'rgb(220,0,0)' }}>
              {tooltipState.formattedValue}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
