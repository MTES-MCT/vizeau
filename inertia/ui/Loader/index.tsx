import './spinner-animation.css'
import { fr } from '@codegouvfr/react-dsfr'

export type LoaderProps = {
  type?: 'spinner' | 'dots'
  size?: 'sm' | 'md' | 'lg'
}

export default function Loader({ type = 'spinner', size = 'md' }: LoaderProps) {
  const spinnerSize = size === 'sm' ? '1.5rem' : size === 'lg' ? '5rem' : '3rem'
  const dotSize = size === 'sm' ? '0.3rem' : size === 'lg' ? '1rem' : '0.75rem'

  if (type === 'spinner') {
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

  return (
    <span className="dot-anim w-fit" role="status">
      <span
        className="dot"
        style={{
          width: dotSize,
          height: dotSize,
          background: fr.colors.decisions.background.flat.blueFrance.default,
        }}
      />
      <span
        className="dot"
        style={{
          width: dotSize,
          height: dotSize,
          background: fr.colors.decisions.background.flat.blueFrance.default,
        }}
      />
      <span
        className="dot"
        style={{
          width: dotSize,
          height: dotSize,
          background: fr.colors.decisions.background.flat.blueFrance.default,
        }}
      />
    </span>
  )
}
