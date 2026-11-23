import { fr } from '@codegouvfr/react-dsfr'
import Button from '@codegouvfr/react-dsfr/Button'
import Input from '@codegouvfr/react-dsfr/Input'

import type { PacagesDraft } from '~/components/parcelle/parcelles-workspace/use_pacages_draft'

/*
 * Méthode d'ajout « PACAGE » : la recherche ajoute directement les parcelles déclarées sous ce
 * numéro, détaillées par PACAGE dans le panneau « Sélection ».
 */
export default function PacageMethod({ pacages }: { pacages: PacagesDraft }) {
  const mentionColor = fr.colors.decisions.text.mention.grey.default

  return (
    <div className="flex flex-col gap-3">
      <p className="fr-text--sm fr-mb-0">
        Le numéro PACAGE permet de retrouver automatiquement les parcelles déclarées à la PAC. Elles
        s’ajoutent à votre sélection, que vous pourrez ensuite ajuster sur la carte.
      </p>

      <form
        noValidate
        className="flex flex-col gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          // Le champ reste actif pendant la recherche pour garder le focus : pas de double envoi
          if (!pacages.isLoading) pacages.search()
        }}
      >
        <Input
          className="fr-mb-0"
          label="Numéro PACAGE"
          hintText="9 chiffres, indiqué sur les déclarations PAC"
          state={pacages.error ? 'error' : 'default'}
          stateRelatedMessage={pacages.error ?? undefined}
          nativeInputProps={{
            inputMode: 'numeric',
            autoComplete: 'off',
            maxLength: 9,
            readOnly: pacages.isLoading,
            value: pacages.value,
            onChange: (event) => pacages.setValue(event.target.value),
          }}
          addon={
            <Button
              type="submit"
              iconId="fr-icon-search-line"
              title="Rechercher"
              disabled={!pacages.isValid}
            />
          }
        />
        {pacages.isLoading && (
          <p className="fr-text--sm fr-mb-0" style={{ color: mentionColor }} role="status">
            Recherche en cours…
          </p>
        )}
      </form>

      <ul className="fr-text--xs fr-mb-0" style={{ color: mentionColor }}>
        <li>
          Un numéro PACAGE correspond à une structure (EARL, GAEC, exploitation individuelle…). Si
          l’exploitation en regroupe plusieurs, recherchez chaque numéro.
        </li>
        <li>Les parcelles ajoutées sont regroupées par PACAGE dans le panneau « Sélection ».</li>
      </ul>
    </div>
  )
}
