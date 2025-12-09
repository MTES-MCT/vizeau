import { fr } from '@codegouvfr/react-dsfr'

import Divider from '~/ui/Divider'

export default function Popup({ exploitation }: { exploitation: { name: string } }) {
  return (
    <div
      style={{
        minWidth: '200px',
        backgroundColor: fr.colors.decisions.background.default.grey.default,
      }}
    >
      <Divider label="Exploitation" />
      <div
        className="flex fr-mt-2w fr-p-1w"
        style={{ backgroundColor: fr.colors.decisions.background.alt.grey.default }}
      >
        <span
          className="fr-icon-building-line"
          aria-hidden="true"
          style={{ color: fr.colors.decisions.text.actionHigh.blueFrance.default }}
        />
        <div className="fr-pl-2w">{exploitation.name}</div>
      </div>
    </div>
  )
}
