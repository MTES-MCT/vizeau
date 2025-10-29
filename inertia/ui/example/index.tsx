// Composant d’exemple

import { fr } from '@codegouvfr/react-dsfr'
import { Box } from '@mui/material'

export default function Example({ text = '' }) {
  return (
    <Box
      component="div"
      className="fr-container fr-mt-5v text-center border border-gray-300 rounded-[8px] p-[12px] max-w-1/2"
    >
      <Box component="p" style={{ color: fr.colors.decisions.text.actionHigh.blueFrance.default }}>
        {text}
      </Box>
    </Box>
  )
}
