export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`

  const kb = bytes / 1024
  if (kb < 1024) return `${parseFloat(kb.toFixed(2))} Ko`

  const mb = kb / 1024
  if (mb < 1024) return `${parseFloat(mb.toFixed(2))} Mo`

  const gb = mb / 1024
  if (gb < 1024) return `${parseFloat(gb.toFixed(2))} Go`

  const tb = gb / 1024

  return `${parseFloat(tb.toFixed(2))} To`
}
