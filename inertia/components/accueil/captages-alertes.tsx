import { useState } from 'react'
import { fr } from '@codegouvfr/react-dsfr'
import Button from '@codegouvfr/react-dsfr/Button'
import type { CaptageAlerteJson } from '#types/captage'

import SectionCard from '~/ui/SectionCard'
import EmptyPlaceholder from '~/ui/EmptyPlaceholder'
import DepassementsListItem from '~/ui/DepassementsListItem'

const NB_CAPTAGES_REPLIES = 5

export type CaptagesAlertesProps = {
  captages: CaptageAlerteJson[]
}

export default function CaptagesAlertes({ captages }: CaptagesAlertesProps) {
  const [listeComplete, setListeComplete] = useState(false)

  const captagesAffiches = listeComplete ? captages : captages.slice(0, NB_CAPTAGES_REPLIES)
  const nbAutresCaptages = captages.length - NB_CAPTAGES_REPLIES

  return (
    <SectionCard
      title="Points de prélèvement à risque"
      caption="Dépassements relevés sur les dernières analyses du contrôle sanitaire"
      size="small"
    >
      {captages.length > 0 ? (
        <div className="flex flex-col gap-3">
          <ul className="flex flex-col gap-2 fr-p-0 fr-m-0">
            {captagesAffiches.map((captage, index) => (
              <li key={`${captage.aac_code}-${captage.code}`} style={{ listStyle: 'none' }}>
                <DepassementsListItem
                  title={captage.nom}
                  priority={index % 2 === 1 ? 'secondary' : 'primary'}
                  linkProps={{ href: `/aac/${captage.aac_code}/installations/${captage.code}` }}
                  depassementsAlerte={captage.depassements_alerte}
                  depassementsReglementaires={captage.depassements_reglementaires}
                  metas={[
                    {
                      iconId: 'fr-icon-government-line',
                      content: `${captage.commune} (${captage.departement})`,
                    },
                    { iconId: 'fr-icon-hexagon-line', content: captage.aac_nom },
                  ]}
                />
              </li>
            ))}
          </ul>

          {nbAutresCaptages > 0 && (
            <div className="flex justify-between items-center gap-2">
              {!listeComplete && (
                <span
                  className="fr-text--sm fr-mb-0 flex-1"
                  style={{ color: fr.colors.decisions.text.mention.grey.default }}
                >
                  {nbAutresCaptages} autre{nbAutresCaptages > 1 ? 's' : ''} installation
                  {nbAutresCaptages > 1 ? 's' : ''} présente{nbAutresCaptages > 1 ? 'nt' : ''} des
                  anomalies
                </span>
              )}
              <div className="flex-1 flex justify-end">
                <Button
                  priority="tertiary no outline"
                  size="small"
                  iconId={listeComplete ? 'fr-icon-eye-off-line' : 'fr-icon-eye-line'}
                  onClick={() => setListeComplete(!listeComplete)}
                >
                  {listeComplete ? 'Masquer la liste complète' : 'Afficher la liste complète'}
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <EmptyPlaceholder
          label="Aucun point de prélèvement suivi ne présente de dépassement."
          illustrativeIcon="fr-icon-drop-fill"
        />
      )}
    </SectionCard>
  )
}
