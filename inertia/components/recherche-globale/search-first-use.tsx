import { fr } from '@codegouvfr/react-dsfr'
import { SEARCH_CATEGORIES } from './search_categories'

export default function SearchFirstUse() {
  return (
    <div>
      <h2 className="fr-h6 fr-mb-1v">Que pouvez-vous rechercher ?</h2>
      <p
        className="fr-text--sm fr-mb-2w"
        style={{ color: fr.colors.decisions.text.mention.grey.default }}
      >
        Saisissez quelques lettres : les résultats s’affichent au fil de la frappe, regroupés par
        thématique.
      </p>

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 list-none p-0 m-0">
        {SEARCH_CATEGORIES.map(({ id, label, hint, iconId }) => (
          <li
            key={id}
            className="flex items-start gap-3 fr-p-2w"
            style={{ border: `1px solid ${fr.colors.decisions.border.default.grey.default}` }}
          >
            <span
              className={`${iconId} flex items-center justify-center shrink-0 w-10 h-10`}
              style={{
                backgroundColor: fr.colors.decisions.background.alt.blueFrance.default,
                color: fr.colors.decisions.text.title.blueFrance.default,
              }}
              aria-hidden="true"
            />
            <span className="flex flex-col">
              <span className="fr-text--bold">{label}</span>
              <span
                className="fr-text--sm fr-mb-0"
                style={{ color: fr.colors.decisions.text.mention.grey.default }}
              >
                {hint}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
