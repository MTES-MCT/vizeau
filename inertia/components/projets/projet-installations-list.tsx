import EmptyPlaceholder from '~/ui/EmptyPlaceholder'
import type { CaptageJson } from '#types/models'
import { stringToColor } from '~/functions/colors'
import ListItem from '~/ui/ListItem'

export type ProjetInstallationsListProps = {
  captages: CaptageJson[]
}

export default function ProjetInstallationsList({ captages }: ProjetInstallationsListProps) {
  if (captages.length === 0) {
    return (
      <EmptyPlaceholder
        illustrativeIcon="fr-icon-collage-fill"
        label="Aucune installation associée"
      />
    )
  }

  return (
    <ul className="flex flex-col gap-2 fr-p-0">
      {captages.map((captage, index) => (
        <li key={captage.code} style={{ listStyle: 'none' }}>
          <ListItem
            additionalInfos={{
              ...(captage.prioritaire === true && {
                message: 'Prioritaire',
                iconId: 'fr-icon-info-fill',
              }),
              ...(captage.etat && {
                alert: {
                  text: captage.etat,
                  severity: captage.etat === 'ACTIF' ? 'success' : 'error',
                },
              }),
            }}
            variant="compact"
            hasBorder
            priority={index % 2 === 1 ? 'secondary' : 'primary'}
            title={captage.nom}
            tags={[
              ...(captage.type
                ? [
                    {
                      label: captage.type,
                      color: stringToColor(captage.type),
                    },
                  ]
                : []),
            ]}
            metas={[
              {
                iconId: 'fr-icon-government-line',
                content:
                  captage.commune && captage.departement
                    ? `${captage.commune} (${captage.departement})`
                    : (captage.commune ?? captage.departement ?? 'Localisation inconnue'),
              },
            ]}
            linkProps={
              captage.aac_code
                ? { href: `/aac/${captage.aac_code}/installations/${captage.code}` }
                : undefined
            }
          />
        </li>
      ))}
    </ul>
  )
}
