import type { Chart as ChartJS } from 'chart.js'
import type { RefObject } from 'react'

export type UseExportGraphOptions = {
  /** Force the chart's native legend to display in the exported image, even if hidden on screen. */
  showLegend?: boolean
}

/**
 * Returns a handler that exports the chart referenced by `chartRef` as a PNG download.
 */
export function useExportGraph(
  chartRef: RefObject<ChartJS | undefined>,
  filename: string,
  { showLegend = false }: UseExportGraphOptions = {}
): () => void {
  return () => {
    const chart = chartRef.current
    if (!chart) return

    const legend = (chart.options?.plugins as { legend?: { display?: boolean } } | undefined)
      ?.legend
    const previousDisplay = legend?.display

    if (showLegend && legend) {
      legend.display = true
      // 'none' skips the animation loop so the redraw happens synchronously,
      // otherwise toBase64Image below can capture the canvas before the legend is drawn.
      chart.update('none')
    }

    const image = chart.toBase64Image('image/png')

    if (showLegend && legend) {
      legend.display = previousDisplay
      chart.update('none')
    }

    const link = document.createElement('a')
    link.href = image
    link.download = filename

    link.click()
  }
}
