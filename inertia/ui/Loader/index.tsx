import './spinner-animation.css'
import { fr } from '@codegouvfr/react-dsfr'

export type LoaderProps = {
  size?: 'sm' | 'md' | 'lg'
}

export default function Loader({ size = 'md' }: LoaderProps) {
  const spinnerSize = size === 'sm' ? '1.5rem' : size === 'lg' ? '5rem' : '3rem'

  return (
    <div
      role="status"
      aria-live="polite"
      className="spinner"
      style={{
        width: spinnerSize,
        height: spinnerSize,
        border: `5px solid ${fr.colors.decisions.text.label.blueFrance.default}`,
        borderTop: '5px solid transparent',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: 'auto',
      }}
    />
  )
}
