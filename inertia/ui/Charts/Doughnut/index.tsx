import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut as ReactChartDoughnut } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend)

export type DoughnutProps = {
  chartItems: {
    data: number
    label: string
    backgroundColor: string
  }[]
  legendSize?: 'sm' | 'md' | 'lg'
  legendSide?: 'top' | 'left' | 'bottom' | 'right'
}

export default function Doughnut({ chartItems, legendSize = 'md', legendSide }: DoughnutProps) {
  const options = {
    plugins: {
      tooltip: {
        enabled: false,
      },
      legend: {
        responsive: true,
        position: legendSide || ('right' as const),
        align: 'center' as const,
        fullSize: true,
        labels: {
          boxWidth: legendSize === 'sm' ? 15 : legendSize === 'lg' ? 35 : 25,
          boxHeight: legendSize === 'sm' ? 15 : legendSize === 'lg' ? 35 : 25,
          font: {
            size: legendSize === 'sm' ? 12 : legendSize === 'lg' ? 20 : 16,
          },
        },
      },
    },
  }
  const colors = chartItems?.map(({ backgroundColor }) => backgroundColor) || []
  const names = chartItems?.map(({ label }) => label) || []
  const values = chartItems?.map(({ data }) => data) || []

  const data = {
    labels: names,
    datasets: [
      {
        data: values,
        backgroundColor: colors,
        devicePixelRatio: 2,
      },
    ],
  }

  return <ReactChartDoughnut data={data} options={options} width={'100%'} />
}
