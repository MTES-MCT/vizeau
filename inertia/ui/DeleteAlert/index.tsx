import { fr } from '@codegouvfr/react-dsfr'
import Button from '@codegouvfr/react-dsfr/Button'

export type DeleteAlertProps = {
  title: string
  description?: string
  size?: 'sm' | 'md'
  onDelete: () => void
}
export default function DeleteAlert({
  title,
  description,
  size = 'md',
  onDelete,
}: DeleteAlertProps) {
  return (
    <div
      className="fr-p-2v flex"
      style={{ border: `1px solid ${fr.colors.decisions.border.plain.error.default}` }}
    >
      <span
        className={`fr-icon-error-warning-line fr-mr-2v ${size === 'sm' ? 'fr-icon--sm' : ''}`}
        style={{ color: fr.colors.decisions.text.default.error.default }}
      ></span>

      <div className="flex flex-col">
        <h6
          className={`fr-m-0 bold ${size === 'sm' ? 'fr-text--sm' : 'fr-text'}`}
          style={{ color: fr.colors.decisions.text.default.error.default }}
        >
          {title}
        </h6>
        {description && (
          <p
            className={`${size === 'sm' ? 'fr-text--sm' : 'fr-text'}`}
            style={{ color: fr.colors.decisions.text.default.error.default }}
          >
            {description}
          </p>
        )}
        <Button
          onClick={onDelete}
          priority="tertiary"
          size={size === 'sm' ? 'small' : 'medium'}
          iconId="fr-icon-delete-line"
          style={{
            color: fr.colors.decisions.text.default.error.default,
            border: `1px solid ${fr.colors.decisions.border.plain.error.default}`,
          }}
        >
          Supprimer
        </Button>
      </div>
    </div>
  )
}
