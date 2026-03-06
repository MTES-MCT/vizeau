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
import { useState, useMemo } from 'react'
import { Line } from 'react-chartjs-2'

export type EvolutiveChartLineProps = {
  chartItems: {
    labels: number[]
    datasets: {
      label: string
      data: number[]
      borderColor: string
      backgroundColor: string
    }[]
  }
  legendSize?: 'sm' | 'md' | 'lg'
  xAxisLabel?: string
  yAxisLabel?: string
}

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

export default function EvolutiveChartLine({
  chartItems,
  legendSize = 'md',
  xAxisLabel = '',
  yAxisLabel = '',
}: EvolutiveChartLineProps) {
  const labels = chartItems.labels || []
  const legendSizeMap = {
    sm: { box: 15, font: 12 },
    md: { box: 20, font: 16 },
    lg: { box: 25, font: 20 },
  }

  const minDate = labels.length > 0 ? Math.min(...labels) : 0
  const maxDate = labels.length > 0 ? Math.max(...labels) : 0

  const [min, setMin] = useState(minDate)
  const [max, setMax] = useState(maxDate)

  const filteredChartItems = useMemo(() => {
    const indices = labels.reduce<number[]>((acc, label, i) => {
      if (label >= min && label <= max) {
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
  }, [min, max, chartItems])

  const options = {
    responsive: true,
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
    },
  }

  return (
    <div className="flex flex-col gap-10">
      <Range
        label=""
        double={true}
        small={true}
        min={minDate}
        max={maxDate}
        nativeInputProps={[
          { value: min, onChange: (e) => setMin(Number(e.target.value)) },
          { value: max, onChange: (e) => setMax(Number(e.target.value)) },
        ]}
      />

      <Line options={options} data={filteredChartItems} />
    </div>
  )
}
