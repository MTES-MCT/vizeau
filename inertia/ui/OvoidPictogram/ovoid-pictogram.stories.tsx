import TechnicalError from '@codegouvfr/react-dsfr/picto/TechnicalError'
import Ecosystem from '@codegouvfr/react-dsfr/picto/Ecosystem'

import OvoidPictogram, { OvoidPictogramProps } from './index.js'

const meta = {
  title: 'UI/OvoidPictogram',
  component: OvoidPictogram,
  tags: ['autodocs'],
  argTypes: {
    pictogram: {
      control: 'object',
      description: 'Composant pictogramme React DSFR (ex: TechnicalError)',
      table: {
        type: { summary: 'React.ElementType' },
      },
    },
    className: {
      control: 'text',
      description: 'Classes CSS supplémentaires appliquées au SVG',
    },
  },
  args: {
    pictogram: TechnicalError,
    className: 'max-w-xs',
  } as OvoidPictogramProps,
}

export default meta

export const Défaut = {}

export const AutrePictogramme = {
  args: {
    pictogram: Ecosystem,
  },
}
