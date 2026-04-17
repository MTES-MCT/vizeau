import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

export type HorizontalChartBarProps = {
  chartItems: {
    label: string
    data: number
    backgroundColor: string
    tooltipValue?: number
  }[]
  xAxisLabel?: string
  unit?: string
  chartHeight?: number
  fontSize?: number
}

export default function HorizontalChartBar({
  chartItems,
  xAxisLabel = '',
  unit = '',
  chartHeight,
  fontSize = 14,
}: HorizontalChartBarProps) {
  const computedChartHeight =
    chartHeight ?? Math.min(Math.max(160, 60 + chartItems.length * 48), 700)

  const options = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        beginAtZero: true,
        ticks: { display: false },
        grid: { display: false },
        border: { display: false },
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
        ticks: { display: false },
        grid: { display: false },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgb(255, 255, 255)',
        titleColor: 'rgb(0, 0, 0)',
        bodyColor: 'rgb(0, 0, 0)',
        titleFont: { size: 16 },
        bodyFont: { size: 14 },
        padding: 10,
        titleMarginBottom: 10,
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        callbacks: {
          label: (context: { dataIndex: number; formattedValue: string }) => {
            const item = chartItems[context.dataIndex]
            const rawValue =
              item && item.tooltipValue !== undefined ? item.tooltipValue : (item?.data ?? 0)
            const value = new Intl.NumberFormat('fr-FR').format(rawValue)
            return unit ? ` ${value} ${unit}` : ` ${value}`
          },
        },
      },
      datalabels: {
        clamp: true,
        font: { size: fontSize, weight: 'bold' as const },
        labels: {
          name: {
            anchor: 'start' as const,
            align: 'end' as const,
            color: '#ffffff',
            formatter: (_: number, context: { dataIndex: number }) => {
              return chartItems[context.dataIndex]?.label ?? ''
            },
          },
          value: {
            anchor: 'end' as const,
            align: 'end' as const,
            color: '#000000',
            formatter: (value: number, context: { dataIndex: number }) => {
              const item = chartItems[context.dataIndex]
              const rawValue = item?.tooltipValue !== undefined ? item.tooltipValue : value
              const formatted = new Intl.NumberFormat('fr-FR').format(rawValue)
              return unit ? `${formatted} ${unit}` : formatted
            },
          },
        },
      },
    },
  }

  const data = {
    labels: chartItems.map(({ label }) => label),
    datasets: [
      {
        data: chartItems.map(({ data }) => data),
        backgroundColor: chartItems.map(({ backgroundColor }) => backgroundColor),
        borderWidth: 0,
      },
    ],
  }

  return (
    <div style={{ height: `${computedChartHeight}px` }}>
      <Bar options={options} data={data} plugins={[ChartDataLabels]} />
    </div>
  )
}
