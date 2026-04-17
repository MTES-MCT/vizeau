import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'
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

export default function VerticalChartBar({
  chartItems,
  legendSize = 'sm',
  yAxisLabel = '',
  unit = '',
  chartHeight = 400,
}: VerticalChartBarProps) {
  const legendSizeMap = {
    sm: { box: 15, font: 12 },
    md: { box: 20, font: 16 },
    lg: { box: 25, font: 20 },
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { stacked: true },
      y: {
        stacked: true,
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
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        align: 'start' as const,
        labels: {
          boxWidth: legendSizeMap[legendSize].box,
          boxHeight: legendSizeMap[legendSize].box,
          font: { size: legendSizeMap[legendSize].font },
        },
      },
      tooltip: {
        backgroundColor: 'rgb(255, 255, 255)',
        titleColor: 'rgb(0, 0, 0)',
        bodyColor: 'rgb(0, 0, 0)',
        titleFont: { size: 16, weight: 'bold' as const },
        bodyFont: { size: 14 },
        padding: 10,
        titleMarginBottom: 10,
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        callbacks: {
          title: (items: { label: string }[]) => items[0]?.label ?? '',
          beforeBody: (items: { dataIndex: number }[]) => {
            const idx = items[0]?.dataIndex
            if (idx === undefined || !chartItems.tooltipExtras) return []
            return chartItems.tooltipExtras.map(
              (extra) => `${extra.label} : ${extra.data[idx] ?? ''}`
            )
          },
          label: (context: { dataset: { label: string }; parsed: { y: number } }) => {
            const value = new Intl.NumberFormat('fr-FR').format(context.parsed.y)
            const suffix = unit ? ` ${unit}` : ''
            return `${context.dataset.label} : ${value}${suffix}`
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
      <Bar options={options} data={data} />
    </div>
  )
}
