export function stringToColor(str: string) {
  const hash = Array.from(str).reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0)
  // Génère une teinte basée sur le hash
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 80%, 85%)`
}

export function brightStringToColor(str: string) {
  const hash = Array.from(str).reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0)
  // Génère une teinte basée sur le hash
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 80%, 60%)`
}
