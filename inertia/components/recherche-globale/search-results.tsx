import { fr } from '@codegouvfr/react-dsfr'
import type { GlobalSearchGroupJson, GlobalSearchItemJson } from '#types/recherche'
import { CATEGORY_BY_ID } from './search_categories'

// Met en évidence la première occurrence de `query` dans `text`, sans tenir compte de la casse ni des accents
const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

function HighlightMatch({ text, query }: { text: string; query: string }) {
  const needle = normalize(query.trim())
  if (!needle) return text

  // Version normalisée du texte, en gardant pour chaque caractère normalisé
  // l'index du caractère d'origine.
  let haystack = ''
  const originIndex: number[] = []
  for (let i = 0; i < text.length; i += 1) {
    for (const char of normalize(text[i])) {
      haystack += char
      originIndex.push(i)
    }
  }

  const start = haystack.indexOf(needle)
  if (start === -1) return text

  const from = originIndex[start]
  const to = originIndex[start + needle.length - 1] + 1

  return (
    <>
      {text.slice(0, from)}
      <mark
        className="bg-transparent underline decoration-2 underline-offset-[3px]"
        style={{ color: 'inherit' }}
      >
        {text.slice(from, to)}
      </mark>
      {text.slice(to)}
    </>
  )
}

export default function SearchResults({
  id,
  labelledBy,
  groups,
  query,
  activeOptionId,
  getOptionId,
  onHover,
  onSelect,
}: {
  id: string
  labelledBy: string
  groups: GlobalSearchGroupJson[]
  query: string
  activeOptionId?: string
  getOptionId: (group: GlobalSearchGroupJson, item: GlobalSearchItemJson) => string
  onHover: (index: number) => void
  onSelect: (index: number) => void
}) {
  let flatIndex = -1

  return (
    <div id={id} role="listbox" aria-labelledby={labelledBy} className="flex flex-col gap-6">
      {groups.map((group) => {
        const { label, iconId } = CATEGORY_BY_ID[group.category]
        const headingId = `${id}-${group.category}-titre`

        return (
          <div key={group.category} role="group" aria-labelledby={headingId}>
            <div
              id={headingId}
              className="flex items-center gap-2 fr-text--sm fr-text--bold fr-mb-1v"
              style={{ color: fr.colors.decisions.text.title.blueFrance.default }}
            >
              <span className={`${iconId} fr-icon--sm`} aria-hidden="true" />
              {label}
              <span
                className="fr-text--regular"
                style={{ color: fr.colors.decisions.text.mention.grey.default }}
              >
                · {group.total}
              </span>
            </div>

            <ul
              role="presentation"
              className="list-none p-0 m-0"
              style={{ borderTop: `1px solid ${fr.colors.decisions.border.default.grey.default}` }}
            >
              {group.items.map((item) => {
                flatIndex += 1
                const index = flatIndex
                const optionId = getOptionId(group, item)
                const isActive = optionId === activeOptionId

                return (
                  <li
                    key={item.id}
                    id={optionId}
                    role="option"
                    aria-selected={isActive}
                    className="flex items-center gap-4 fr-p-3v fr-pb-3v cursor-pointer"
                    style={{
                      borderBottom: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
                      backgroundColor: isActive
                        ? fr.colors.decisions.background.alt.blueFrance.default
                        : undefined,
                    }}
                    onMouseMove={() => onHover(index)}
                    onClick={() => onSelect(index)}
                  >
                    <span className="flex flex-col grow min-w-0">
                      <span
                        className="fr-text--bold"
                        style={{
                          color: isActive
                            ? fr.colors.decisions.text.title.blueFrance.default
                            : undefined,
                        }}
                      >
                        <HighlightMatch text={item.title} query={query} />
                      </span>
                      {item.subtitle && (
                        <span
                          className="fr-text--sm fr-mb-0"
                          style={{ color: fr.colors.decisions.text.mention.grey.default }}
                        >
                          {item.subtitle}
                        </span>
                      )}
                    </span>
                    <span
                      className="fr-icon-arrow-right-line fr-icon--sm shrink-0"
                      style={{ color: fr.colors.decisions.text.actionHigh.blueFrance.default }}
                      aria-hidden="true"
                    />
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
