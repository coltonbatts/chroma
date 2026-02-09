// ASCII renderer: converts dithered color indices → text and canvas rendering

import { DitherResult, DitherSettings, RGB } from './types'
import { CHARACTER_SETS, paletteIndexToChar } from './characterSets'

/**
 * Build DitherResult from dithered color index array.
 */
export function buildAsciiResult(
  colorIndices: Uint8Array,
  cols: number,
  rows: number,
  palette: RGB[],
  settings: DitherSettings,
  processingTime: number
): DitherResult {
  const charSet = CHARACTER_SETS[settings.characterSet]
  const lines: string[] = []

  for (let y = 0; y < rows; y++) {
    let line = ''
    for (let x = 0; x < cols; x++) {
      const ci = colorIndices[y * cols + x]
      line += paletteIndexToChar(ci, palette, charSet, settings.invert)
    }
    lines.push(line)
  }

  return {
    text: lines.join('\n'),
    colorIndices: Array.from(colorIndices),
    cols,
    rows,
    palette,
    processingTime,
  }
}

/**
 * Render a DitherResult onto a canvas with colored characters.
 */
export function renderToCanvas(
  ctx: CanvasRenderingContext2D,
  result: DitherResult,
  settings: DitherSettings,
  bgColor: RGB,
  fgColor: RGB | null,
): void {
  const { cols, rows, palette, colorIndices } = result
  const fontSize = settings.fontSize
  const charWidth = fontSize * 0.6
  const charHeight = fontSize

  const canvasWidth = Math.ceil(cols * charWidth)
  const canvasHeight = Math.ceil(rows * charHeight)

  ctx.canvas.width = canvasWidth
  ctx.canvas.height = canvasHeight

  // Background
  ctx.fillStyle = `rgb(${bgColor.r},${bgColor.g},${bgColor.b})`
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  // Text rendering
  ctx.font = `${fontSize}px monospace`
  ctx.textBaseline = 'top'

  const charSet = CHARACTER_SETS[settings.characterSet]
  const usePerCharColor = palette.length > 2 && !fgColor

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const ci = colorIndices[y * cols + x]
      const char = paletteIndexToChar(ci, palette, charSet, settings.invert)

      if (char === ' ') continue

      if (usePerCharColor) {
        const c = palette[ci]
        ctx.fillStyle = `rgb(${c.r},${c.g},${c.b})`
      } else if (fgColor) {
        ctx.fillStyle = `rgb(${fgColor.r},${fgColor.g},${fgColor.b})`
      } else {
        const c = palette[ci]
        ctx.fillStyle = `rgb(${c.r},${c.g},${c.b})`
      }

      ctx.fillText(char, x * charWidth, y * charHeight)
    }
  }
}

/**
 * Export the ASCII result as plain text.
 */
export function exportAsText(result: DitherResult): string {
  return result.text
}

/**
 * Export the canvas as a PNG blob.
 */
export function exportAsPng(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png')
  })
}
