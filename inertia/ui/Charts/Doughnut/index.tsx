import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut as ReactChartDoughnut } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend)

export type DoughnutProps = {
  chartItems: {
    data: number
    label: string
    backgroundColor: string
    tooltipValue?: number | undefined
  }[]
  legendSize?: 'sm' | 'md' | 'lg'
  legendSide?: 'top' | 'left' | 'bottom' | 'right'
  hideLegend?: boolean
  unit?: string
}

export default function Doughnut({
  chartItems,
  legendSize = 'md',
  legendSide,
  hideLegend = false,
  unit = '%',
}: DoughnutProps) {
  const legendSizeMap = {
    sm: { box: 15, font: 12 },
    md: { box: 25, font: 16 },
    lg: { box: 35, font: 20 },
  }

  const options = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: !hideLegend,
        responsive: true,
        position: legendSide || ('right' as const),
        align: 'center' as const,
        fullSize: true,
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
        },
        bodyFont: {
          size: 14,
        },
        padding: 10,
        titleMarginBottom: 10,
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        callbacks: {
          label: (context: { formattedValue: string; dataIndex: number }) => {
            const item = chartItems[context.dataIndex]
            const value =
              item?.tooltipValue !== undefined
                ? new Intl.NumberFormat('fr-FR').format(item.tooltipValue)
                : context.formattedValue
            return ` ${value} ${unit}`
          },
        },
      },
    },
  }
  const colors = chartItems?.map(({ backgroundColor }) => backgroundColor) || []
  const names = chartItems?.map(({ label }) => label) || []
  const total = chartItems?.reduce((sum, { data }) => sum + Math.max(0, data), 0) || 0
  const minVisible = total * 0.003
  const displayValues =
    chartItems?.map(({ data }) => (data > 0 && data < minVisible ? minVisible : data)) || []

  const data = {
    labels: names,
    datasets: [
      {
        data: displayValues,
        backgroundColor: colors,
        borderWidth: 0,
        devicePixelRatio: 2,
      },
    ],
  }

  return <ReactChartDoughnut data={data} options={options} />
}
