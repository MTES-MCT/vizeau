import { forwardRef } from 'react'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  type ChartOptions,
  type TooltipItem,
} from 'chart.js'

import { Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

export type VerticalChartBarProps = {
  chartItems: {
    labels: (string | number)[]
    datasets: {
      label: string
      data: number[]
      backgroundColor: string
    }[]
    tooltipExtras?: {
      label: string
      data: (string | number)[]
    }[]
  }

  legendSize?: 'sm' | 'md' | 'lg'
  yAxisLabel?: string
  unit?: string
  chartHeight?: number
}

const VerticalChartBar = forwardRef<ChartJS<'bar'> | undefined, VerticalChartBarProps>(
  function VerticalChartBar(
    { chartItems, legendSize = 'sm', yAxisLabel = '', unit = '', chartHeight = 400 },
    ref
  ) {
    const legendSizeMap = {
      sm: { box: 15, font: 12 },
      md: { box: 20, font: 16 },
      lg: { box: 25, font: 20 },
    }

    const options: ChartOptions<'bar'> = {
      responsive: true,
      maintainAspectRatio: false,

      scales: {
        x: {
          stacked: true,
        },

        y: {
          stacked: true,
          beginAtZero: true,

          ...(yAxisLabel
            ? {
                title: {
                  display: true,
                  text: yAxisLabel,
                  font: {
                    size: 14,
                    weight: 'bold',
                  },
                },
              }
            : {}),
        },
      },

      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          align: 'start',

          labels: {
            boxWidth: legendSizeMap[legendSize].box,
            boxHeight: legendSizeMap[legendSize].box,
            font: {
              size: legendSizeMap[legendSize].font,
            },
          },
        },

        tooltip: {
          backgroundColor: 'rgb(255, 255, 255)',
          titleColor: 'rgb(0, 0, 0)',
          bodyColor: 'rgb(0, 0, 0)',

          titleFont: {
            size: 16,
            weight: 'bold',
          },

          bodyFont: {
            size: 14,
          },

          padding: 10,
          titleMarginBottom: 10,
          borderColor: 'rgba(0, 0, 0, 0.1)',
          borderWidth: 1,

          callbacks: {
            title: (items: TooltipItem<'bar'>[]) => items[0]?.label ?? '',

            beforeBody: (items: TooltipItem<'bar'>[]) => {
              const idx = items[0]?.dataIndex

              if (idx === undefined || !chartItems.tooltipExtras) {
                return []
              }

              return chartItems.tooltipExtras.map(
                (extra) => `${extra.label} : ${extra.data[idx] ?? ''}`
              )
            },

            label: (context: TooltipItem<'bar'>) => {
              const value = new Intl.NumberFormat('fr-FR').format(context.parsed.y ?? 0)

              const suffix = unit ? ` ${unit}` : ''

              return `${context.dataset.label ?? ''} : ${value}${suffix}`
            },
          },
        },
      },
    }

    const data = {
      labels: chartItems.labels,

      datasets: chartItems.datasets.map((ds) => ({
        label: ds.label,
        data: ds.data,
        backgroundColor: ds.backgroundColor,
        borderWidth: 0,
      })),
    }

    return (
      <div style={{ height: `${chartHeight}px` }}>
        <Bar ref={ref} options={options} data={data} />
      </div>
    )
  }
)

VerticalChartBar.displayName = 'VerticalChartBar'

export default VerticalChartBar
