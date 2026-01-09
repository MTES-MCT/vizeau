import './spinner-animation.css'
import { fr } from '@codegouvfr/react-dsfr'

export type LoaderProps = {
  size?: 'sm' | 'md' | 'lg'
}

export default function Loader({ size = 'md' }: LoaderProps) {
  return (
    <div
      className="spinner"
      style={{
        width: size === 'sm' ? '1.5rem' : size === 'lg' ? '5rem' : '3rem',
        height: size === 'sm' ? '1.5rem' : size === 'lg' ? '5rem' : '3rem',
        border: `5px solid ${fr.colors.decisions.text.label.blueFrance.default}`,
        borderTop: '4px solid transparent',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: 'auto',
      }}
    />
  )
}
