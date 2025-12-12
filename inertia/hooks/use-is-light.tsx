import { useEffect, useState } from 'react'
import tinycolor from 'tinycolor2'

export function useIsLightTheme(): boolean {
  const [isLight, setIsLight] = useState(true)

  useEffect(() => {
    const backgroundColor = window.getComputedStyle(document.body).backgroundColor
    const color = tinycolor(backgroundColor)
    setIsLight(color.isLight())
  }, [])

  return isLight
}
