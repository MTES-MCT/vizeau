import { Range } from '@codegouvfr/react-dsfr/Range'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { useState, useMemo, useEffect } from 'react'
import { Line } from 'react-chartjs-2'
import { min, max } from 'lodash-es'

export type EvolutiveChartLineProps = {
  chartItems: {
    labels: number[]
    datasets: {
      label: string
      data: number[]
      borderColor: string
      backgroundColor: string
      yAxisID?: 'y' | 'y1'
    }[]
  }
  legendSize?: 'sm' | 'md' | 'lg'
  xAxisLabel?: string
  yAxisLabel?: string
  yAxisRightLabel?: string
  unit?: string
  chartHeight?: number
}

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

export default function EvolutiveChartLine({
  chartItems,
  legendSize = 'sm',
  xAxisLabel = '',
  yAxisLabel = '',
  yAxisRightLabel = '',
  unit = '%',
  chartHeight,
}: EvolutiveChartLineProps) {
  const labels = chartItems.labels || []
  const legendSizeMap = {
    sm: { box: 15, font: 12 },
    md: { box: 20, font: 16 },
    lg: { box: 25, font: 20 },
  }

  // Use lodash for min/max calculation
  const minDate = labels.length > 0 ? (min(labels) ?? 0) : 0
  const maxDate = labels.length > 0 ? (max(labels) ?? 0) : 0

  const [minValue, setMinValue] = useState(minDate)
  const [maxValue, setMaxValue] = useState(maxDate)

  // Sync minValue/maxValue with bounds if labels/minDate/maxDate change
  useEffect(() => {
    setMinValue((prev) => {
      if (prev < minDate || prev > maxDate) return minDate
      return prev
    })
    setMaxValue((prev) => {
      if (prev > maxDate || prev < minDate) return maxDate
      return prev
    })
  }, [minDate, maxDate, labels])

  const filteredChartItems = useMemo(() => {
    const indices = labels.reduce<number[]>((acc, label, i) => {
      if (label >= minValue && label <= maxValue) {
        acc.push(i)
      }
      return acc
    }, [])

    return {
      labels: indices.map((i) => labels[i]),
      datasets: chartItems.datasets.map((dataset) => ({
        ...dataset,
        data: indices.map((i) => dataset.data[i]),
      })),
    }
  }, [minValue, maxValue, chartItems])

  const hasRightAxis = filteredChartItems.datasets.some((ds) => ds.yAxisID === 'y1')
  const computedChartHeight =
    chartHeight ?? Math.min(Math.max(320, 240 + filteredChartItems.datasets.length * 24), 700)

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ...(xAxisLabel
          ? {
              title: {
                display: true,
                text: xAxisLabel,
                font: { size: 16, weight: 'bold' as const },
              },
            }
          : {}),
      },
      y: {
        type: 'linear' as const,
        position: 'left' as const,
        ...(yAxisLabel
          ? {
              title: {
                display: true,
                text: yAxisLabel,
                font: { size: 16, weight: 'bold' as const },
              },
            }
          : {}),
      },
      ...(hasRightAxis
        ? {
            y1: {
              type: 'linear' as const,
              position: 'right' as const,
              grid: { drawOnChartArea: false },
              ...(yAxisRightLabel
                ? {
                    title: {
                      display: true,
                      text: yAxisRightLabel,
                      font: { size: 16, weight: 'bold' as const },
                    },
                  }
                : {}),
            },
          }
        : {}),
    },
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        responsive: true,
        align: 'start' as const,
        labels: {
          boxWidth: legendSizeMap[legendSize].box,
          boxHeight: legendSizeMap[legendSize].box,
          font: {
            size: legendSizeMap[legendSize].font,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const datasetLabel = context?.dataset?.label ?? ''
            const value = context?.formattedValue ?? ''
            const unitSuffix = unit ? ` ${unit}` : ''
            if (datasetLabel) {
              return `${datasetLabel}: ${value}${unitSuffix}`
            }
            return `${value}${unitSuffix}`
          },
        },
        backgroundColor: 'rgb(255, 255, 255)',
        titleColor: 'rgb(0, 0, 0)',
        bodyColor: 'rgb(0, 0, 0)',
        titleFont: {
          size: 16,
        },
        bodyFont: {
          size: 14,
        },
        padding: 10,
        titleMarginBottom: 10,
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
      },
    },
  }

  return (
    <div className="flex flex-col gap-10">
      <Range
        double={true}
        small={true}
        min={minDate}
        max={maxDate}
        label={''}
        nativeInputProps={[
          { value: minValue, onChange: (e) => setMinValue(Number(e.target.value)) },
          { value: maxValue, onChange: (e) => setMaxValue(Number(e.target.value)) },
        ]}
      />

      <div style={{ height: `${computedChartHeight}px` }}>
        <Line options={options} data={filteredChartItems} />
      </div>
    </div>
  )
}
