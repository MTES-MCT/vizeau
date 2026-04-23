import ListItem from '~/ui/ListItem'
import { stringToColor } from '~/functions/colors'

export type ProjetInstallationsProps = {
  installations: any[]
}

export default function ProjetInstallations({ installations }: ProjetInstallationsProps) {
  return (
    <div>
      {installations.map((installation, index) => (
        <ListItem
          key={installation.code}
          additionalInfos={{
            ...(installation.prioritaire === true && {
              message: 'Prioritaire',
              iconId: 'fr-icon-info-fill',
            }),
            ...(installation.etat && {
              alert: {
                text: installation.etat,
                severity: installation.etat === 'ACTIF' ? 'success' : 'error',
              },
            }),
          }}
          variant="compact"
          hasBorder
          linkProps={{ href: `/installations/${installation.code}` }} // TODO: Update with the correct link to the installation details page
          priority={index % 2 === 1 ? 'secondary' : 'primary'}
          title={<span className="flex items-center gap-1">{installation.nom}</span>}
          tags={[
            ...(installation.type
              ? [
                  {
                    label: installation.type,
                    color: stringToColor(installation.type),
                  },
                ]
              : []),
          ]}
          metas={[
            {
              iconId: 'fr-icon-government-line',
              content: `${installation.commune} (${installation.departement})`,
            },
          ]}
        />
      ))}
    </div>
  )
}
