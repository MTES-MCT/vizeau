import { Download } from '@codegouvfr/react-dsfr/Download'
import { Button } from '@codegouvfr/react-dsfr/Button'

import { fr } from '@codegouvfr/react-dsfr'
import { formatBytes } from '~/functions/size'

export type FileItemProps = {
  name: string
  href: string
  size?: number | string
  format?: string
  deletable?: boolean
  isLast?: boolean
  onDelete?: () => void
}

export default function FileItem({
  name,
  href,
  size,
  format,
  deletable,
  onDelete,
  isLast,
}: FileItemProps) {
  const formattedSize = typeof size === 'number' ? formatBytes(size) : size

  return (
    <div
      className="flex fr-gap-2w items-start fr-px-1w fr-pb-1w"
      style={{
        borderBottom: `${isLast ? 'none' : `1px solid ${fr.colors.decisions.border.default.grey.default}`}`,
      }}
    >
      <Download
        label={name}
        details={[format?.toUpperCase(), formattedSize].filter(Boolean).join(' - ')}
        linkProps={{ href }}
        className="w-full fr-mb-0"
      />

      {deletable && (
        <Button
          iconId="fr-icon-close-line"
          onClick={onDelete}
          priority="tertiary no outline"
          title="Supprimer le fichier"
          size="small"
          style={{ color: fr.colors.decisions.text.default.error.default }}
        />
      )}
    </div>
  )
}
