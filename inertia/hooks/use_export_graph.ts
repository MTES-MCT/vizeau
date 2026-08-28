import type { Chart as ChartJS } from 'chart.js'
import type { RefObject } from 'react'

export type UseExportGraphOptions = {
  /** Force the chart's native legend to display in the exported image, even if hidden on screen. */
  showLegend?: boolean
}

type LegendPluginOptions = {
  display?: boolean
  position?: 'top' | 'left' | 'bottom' | 'right'
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

    const legend = (chart.options?.plugins as { legend?: LegendPluginOptions } | undefined)?.legend
    const previousDisplay = legend?.display
    const originalWidth = chart.width
    const originalHeight = chart.height

    if (showLegend && legend) {
      legend.display = true

      // Pass 1: give the chart a lot of extra height so Chart.js lays out every
      // legend item without clipping any of them, then read how much room it needed.
      chart.resize(originalWidth, originalHeight + 2000)
      chart.update('none')
      const legendHeight = (chart as { legend?: { height?: number } }).legend?.height ?? 0

      // Pass 2: resize to fit the chart and the full legend, then redraw before capturing.
      // A top/bottom legend stacks below the chart (heights add up); a left/right legend
      // sits beside it (they share the available height, so take the larger of the two).
      const isHorizontalLegend = legend.position === 'top' || legend.position === 'bottom'
      const exportHeight = isHorizontalLegend
        ? originalHeight + legendHeight
        : Math.max(originalHeight, legendHeight)

      chart.resize(originalWidth, exportHeight)
      chart.update('none')
    }

    const image = chart.toBase64Image('image/png')

    if (showLegend && legend) {
      legend.display = previousDisplay
      // Resize back to the exact original dimensions: the container has no fixed
      // height, so it stretched to match the taller canvas above, and a no-args
      // resize() would just re-measure that now-stretched container.
      chart.resize(originalWidth, originalHeight)
      chart.update('none')
    }

    const link = document.createElement('a')
    link.href = image
    link.download = filename

    link.click()
  }
}
