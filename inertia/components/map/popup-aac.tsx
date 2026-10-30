import { createRoot } from 'react-dom/client'
import { fr } from '@codegouvfr/react-dsfr'

import LabelInfo from '~/ui/LabelInfo'

interface PopupAacProps {
  nom: string
  code: string
  surface?: number | null
}

export default function PopupAac({ nom, code, surface }: PopupAacProps) {
  return (
    <div
      style={{
        minWidth: '200px',
        backgroundColor: fr.colors.decisions.background.default.grey.default,
        fontFamily: 'Marianne, arial, sans-serif',
      }}
    >
      <p className="fr-text--sm font-bold fr-mb-1w">{nom}</p>
      <div className="flex flex-col gap-1">
        <LabelInfo label="Code AAC" icon="fr-icon-hashtag" size="sm" info={code} />
        {typeof surface === 'number' && (
          <LabelInfo
            label="Surface totale"
            icon="fr-icon-ruler-line"
            size="sm"
            info={`${Math.round(surface)} ha`}
          />
        )}
      </div>
    </div>
  )
}

export function renderPopupAac(
  nom: string,
  code: string,
  surface: number | null | undefined
): HTMLDivElement {
  const container = document.createElement('div')
  const root = createRoot(container)
  root.render(<PopupAac nom={nom} code={code} surface={surface} />)
  return container
}
