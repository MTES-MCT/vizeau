// Composant d’exemple

import { fr } from '@codegouvfr/react-dsfr'

export default function Example({ text = '' }) {
  return (
    <div className="fr-container fr-mt-5v text-center border border-gray-300 rounded-[8px] p-[12px] max-w-1/2">
      <p style={{ color: fr.colors.decisions.background.contrast.purpleGlycine.active }}>{text}</p>
    </div>
  )
}
