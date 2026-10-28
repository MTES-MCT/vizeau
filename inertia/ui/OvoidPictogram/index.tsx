import ovoidUrl from '@codegouvfr/react-dsfr/dsfr/artwork/background/ovoid.svg?url'

export type OvoidPictogramProps = {
  pictogram: React.ElementType
  className?: string
}

// Pictogramme DSFR sur fond ovoïde, dimensions et position reprises du modèle de page d’erreur du DSFR.
// L’illustration occupe toute la largeur de son conteneur.
export default function OvoidPictogram({ pictogram: Pictogram, className }: OvoidPictogramProps) {
  return (
    <svg
      className={`fr-responsive-img fr-artwork ${className ?? ''}`}
      aria-hidden="true"
      width="160"
      height="200"
      viewBox="0 0 160 200"
    >
      <use className="fr-artwork-motif" href={`${ovoidUrl}#artwork-motif`} />
      <use className="fr-artwork-background" href={`${ovoidUrl}#artwork-background`} />
      <Pictogram x={40} y={60} width={80} height={80} />
    </svg>
  )
}
