import { useEffect, useRef, useState } from 'react'

type RevealDirection = 'up' | 'down' | 'left' | 'right' | 'none'

export type RevealProps = {
  children: React.ReactNode
  /** Direction depuis laquelle l'élément apparaît. */
  direction?: RevealDirection
  /** Délai avant le déclenchement de l'animation (en ms). */
  delay?: number
  /** Durée de l'animation (en ms). */
  duration?: number
  /** Distance de translation initiale (en px). */
  distance?: number
  /** Rejoue l'animation à chaque entrée dans le viewport. */
  once?: boolean
  className?: string
  as?: React.ElementType
}

const translations: Record<RevealDirection, (d: number) => string> = {
  up: (d) => `translate3d(0, ${d}px, 0)`,
  down: (d) => `translate3d(0, -${d}px, 0)`,
  left: (d) => `translate3d(${d}px, 0, 0)`,
  right: (d) => `translate3d(-${d}px, 0, 0)`,
  none: () => 'translate3d(0, 0, 0)',
}

/**
 * Anime l'apparition de son contenu lorsqu'il entre dans le viewport,
 * via IntersectionObserver. Respecte `prefers-reduced-motion`.
 */
export default function Reveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 700,
  distance = 32,
  once = true,
  className = '',
  as: Tag = 'div',
}: RevealProps) {
  const ref = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReducedMotion(media.matches)

    onChange()
    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', onChange)
      return () => media.removeEventListener('change', onChange)
    }
    media.addListener(onChange)
    return () => media.removeListener(onChange)
  }, [])

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true)
            if (once) observer.unobserve(entry.target)
          } else if (!once) {
            setVisible(false)
          }
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [once])

  const shouldAnimate = !reducedMotion

  return (
    <Tag
      ref={ref}
      className={className}
      style={{
        opacity: shouldAnimate && !visible ? 0 : 1,
        transform:
          shouldAnimate && !visible ? translations[direction](distance) : 'translate3d(0, 0, 0)',
        transition: shouldAnimate
          ? `opacity ${duration}ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`
          : undefined,
        willChange: shouldAnimate ? 'opacity, transform' : undefined,
      }}
    >
      {children}
    </Tag>
  )
}
