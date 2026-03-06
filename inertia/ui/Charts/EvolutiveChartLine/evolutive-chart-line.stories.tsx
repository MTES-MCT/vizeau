import EvolutiveChartLine, { EvolutiveChartLineProps } from './index.js'
const chartData = {
  labels: [2026, 2025, 2024, 2023, 2022, 2021, 2020],
  datasets: [
    {
      label: 'Dataset 1',
      data: [65, 59, 80, 81, 56, 55, 40],
      borderColor: 'rgba(75,192,192,1)',
      backgroundColor: 'rgba(75,192,192,1)',
    },
    {
      label: 'Dataset 2',
      data: [28, 48, 40, 19, 86, 27, 90],
      borderColor: 'rgba(153,102,255,1)',
      backgroundColor: 'rgba(153,102,255,1)',
    },
    {
      label: 'Dataset 3',
      data: [18, 48, 77, 9, 100, 27, 40],
      borderColor: 'rgba(255,159,64,1)',
      backgroundColor: 'rgba(255,159,64,1)',
    },
  ],
}

const meta = {
  title: 'UI/Charts/EvolutiveChartLine',
  component: EvolutiveChartLine,
  tags: ['autodocs'],
  argTypes: {
    chartItems: {
      control: 'object',
    },
  },
  args: {
    chartItems: chartData,
    legendSize: 'md',
    xAxisLabel: 'Year',
    yAxisLabel: 'Value',
  } as EvolutiveChartLineProps,
}

export default meta

export const Défaut = {}
