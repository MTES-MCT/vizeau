import type { CaptageRattache } from '#types/aac'
import ListItem from '~/ui/ListItem'

export type CaptagesRattachesListProps = {
  captages: CaptageRattache[]
}

/**
 * Liste des captages rattachés à une installation (même code BSS dans le Sandre).
 */
export default function CaptagesRattachesList({ captages }: CaptagesRattachesListProps) {
  return (
    <ul className="flex flex-col gap-2 fr-p-0 fr-m-0">
      {captages.map((captage, index) => (
        <li key={captage.code} style={{ listStyle: 'none' }}>
          <ListItem
            variant="compact"
            hasBorder
            priority={index % 2 === 1 ? 'secondary' : 'primary'}
            title={captage.nom}
            additionalInfos={
              captage.etat
                ? {
                    alert: {
                      text: captage.etat,
                      severity: captage.etat === 'ACTIF' ? 'success' : 'error',
                    },
                  }
                : undefined
            }
            metas={[
              { iconId: null, content: `Code : ${captage.code}` },
              ...(captage.code_bss
                ? [{ iconId: null, content: `Ancien code BSS : ${captage.code_bss}` }]
                : []),
              ...(captage.code_bss_nouveau
                ? [{ iconId: null, content: `Nouveau code BSS : ${captage.code_bss_nouveau}` }]
                : []),
            ]}
          />
        </li>
      ))}
    </ul>
  )
}
