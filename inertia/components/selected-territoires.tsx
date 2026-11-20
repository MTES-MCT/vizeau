import { Tag } from '@codegouvfr/react-dsfr/Tag'

type TerritoireLabelData = {
  id: string
  code: string | null
  name: string | null
}

export function getTerritoireTitle(territoire: TerritoireLabelData): string {
  if (territoire.name) return territoire.name
  if (territoire.code) return `AAC ${territoire.code}`
  return `Territoire non-SANDRE sans nom (${territoire.id})`
}

type SelectedTerritoiresProps = {
  /** Tous les territoires accessibles, pas seulement ceux de la page affichée. */
  territoires: TerritoireLabelData[]
  selectedIds: string[]
  onRemove: (id: string) => void
}

/*
 * Récapitulatif des territoires sélectionnés, visible quelle que soit la page de la liste
 * paginée affichée en dessous.
 */
export default function SelectedTerritoires({
  territoires,
  selectedIds,
  onRemove,
}: SelectedTerritoiresProps) {
  const selected = territoires.filter((territoire) => selectedIds.includes(territoire.id))

  return (
    <div className="flex flex-col gap-2">
      <p className="fr-text--bold fr-mb-0">AAC sélectionnées ({selected.length})</p>
      {selected.length === 0 ? (
        <p className="fr-text--sm fr-mb-0">Aucune AAC sélectionnée.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {selected.map((territoire) => (
            <Tag
              key={territoire.id}
              dismissible
              nativeButtonProps={{
                'onClick': () => onRemove(territoire.id),
                'aria-label': `Retirer ${getTerritoireTitle(territoire)}`,
              }}
            >
              {getTerritoireTitle(territoire)}
            </Tag>
          ))}
        </div>
      )}
    </div>
  )
}
