import { useState } from 'react'

import LabeledProgressBar, { LabeledProgressBarProps } from './index.js'
import { fr } from '@codegouvfr/react-dsfr'

const meta = {
  title: 'UI/LabeledProgressBar',
  component: LabeledProgressBar,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: { type: 'radio' },
      options: ['sm', 'md', 'lg'],
      defaultValue: 'md',
    },
    iconId: { control: 'text' },
    src: { control: 'text' },
    label: { control: 'text' },
    progressBarValues: { control: 'object' },
  },
  args: {
    size: 'md',
    iconId: 'fr-icon-download-line',
    label: 'Téléchargement en cours',
    progressBarValues: {
      value: 40,
      total: 100,
      unit: 'ha',
      progressColor: '#007BFF',
    },
  } as LabeledProgressBarProps,
}

export default meta

const InteractiveTemplate = (args: LabeledProgressBarProps) => {
  const [progressValue, setProgressValue] = useState(args.progressBarValues?.value || 0)

  return (
    <div className="flex flex-col gap-3">
      <LabeledProgressBar
        {...args}
        progressBarValues={{
          ...args.progressBarValues!,
          value: progressValue,
        }}
      />

      <input
        type="number"
        min="0"
        max={args.progressBarValues?.total || 100}
        value={progressValue}
        className="w-fit"
        style={{
          border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
          padding: '4px',
        }}
        onChange={(e) => {
          const newValue = parseInt(e.target.value, 10)
          setProgressValue(newValue)
        }}
      />
    </div>
  )
}

export const Défaut = {
  render: InteractiveTemplate,
}

export const SansIcône = {
  args: {
    iconId: undefined,
  },
}

export const AvecImage = {
  args: {
    iconId: undefined,
    src: 'cultures-pictos/light/groupe-17.png',
  },
}

export const TailleSm = {
  args: {
    size: 'sm',
  },
}

export const TailleSmAvecImage = {
  args: {
    size: 'sm',
    iconId: undefined,
    src: 'cultures-pictos/light/groupe-17.png',
  },
}

export const ProgressionComplète = {
  args: {
    progressBarValues: {
      value: 100,
      total: 100,
      progressColor: fr.colors.decisions.background.contrast.greenMenthe.active,
    },
  },
}

export const SansUnité = {
  args: {
    progressBarValues: {
      value: 75,
      total: 150,
      unit: undefined,
      progressColor: fr.colors.decisions.background.contrast.yellowMoutarde.active,
    },
  },
}
