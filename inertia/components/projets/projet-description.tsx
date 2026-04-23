import { useState } from 'react'

import TruncatedText from '~/ui/TruncatedText'
import EmptyPlaceholder from '~/ui/EmptyPlaceholder'
import { CallOut } from '@codegouvfr/react-dsfr/CallOut'

export type ProjetDescriptionProps = {
  description: string | null
}

export default function ProjetDescription({ description }: ProjetDescriptionProps) {
  const [showMoreDescription, setShowMoreDescription] = useState(false)

  return (
    <CallOut
      {...((description?.length ?? 0) > 500 && {
        buttonProps: {
          children: 'Afficher plus',
          onClick: () => setShowMoreDescription(!showMoreDescription),
        },
      })}
      title="Description du projet"
    >
      {description ? (
        <TruncatedText
          maxStringLength={showMoreDescription ? description.length : 500}
          hideTooltip
          className="fr-text--md"
        >
          {description}
        </TruncatedText>
      ) : (
        <EmptyPlaceholder
          size="md"
          priority="secondary"
          label="Aucune description fournie pour ce projet."
        />
      )}
    </CallOut>
  )
}
