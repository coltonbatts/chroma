// Web Worker for dithering pipeline
// Runs: downsample → quantize → dither → build ASCII result

import { WorkerMessage, WorkerResponse, DitherSettings, RGB } from './types'
import { getPaletteForMode } from './paletteReduction'
import { applyDithering } from './algorithms'
import { buildAsciiResult } from './asciiRenderer'
import { PRESETS } from './paletteReduction'

/**
 * Downsample ImageData to target columns with aspect ratio correction.
 * Returns Float32Array of RGB values (width * height * 3).
 */
function downsample(
  imageData: ImageData,
  targetCols: number,
  aspectRatio: number
): { pixels: Float32Array; width: number; height: number } {
  const srcW = imageData.width
  const srcH = imageData.height
  const src = imageData.data

  const cellW = srcW / targetCols
  const cellH = cellW / aspectRatio
  const targetRows = Math.max(1, Math.floor(srcH / cellH))

  const pixels = new Float32Array(targetCols * targetRows * 3)

  for (let y = 0; y < targetRows; y++) {
    for (let x = 0; x < targetCols; x++) {
      // Average the pixels in this cell
      const sx0 = Math.floor(x * cellW)
      const sy0 = Math.floor(y * cellH)
      const sx1 = Math.min(Math.floor((x + 1) * cellW), srcW)
      const sy1 = Math.min(Math.floor((y + 1) * cellH), srcH)

      let rSum = 0, gSum = 0, bSum = 0, count = 0

      for (let sy = sy0; sy < sy1; sy++) {
        for (let sx = sx0; sx < sx1; sx++) {
          const si = (sy * srcW + sx) * 4
          rSum += src[si]
          gSum += src[si + 1]
          bSum += src[si + 2]
          count++
        }
      }

      if (count > 0) {
        const di = (y * targetCols + x) * 3
        pixels[di] = rSum / count
        pixels[di + 1] = gSum / count
        pixels[di + 2] = bSum / count
      }
    }
  }

  return { pixels, width: targetCols, height: targetRows }
}

function processImage(imageData: ImageData, settings: DitherSettings) {
  const start = performance.now()

  // Resolve palette from preset or mode
  let palette: RGB[]
  let presetData = settings.preset ? PRESETS[settings.preset] : null

  if (presetData) {
    palette = presetData.palette
  } else {
    palette = getPaletteForMode(settings.paletteMode, settings.customPalette)
  }

  // Downsample
  const { pixels, width, height } = downsample(imageData, settings.density, settings.aspectRatio)

  // Make a copy of original pixels before dithering (dithering modifies in-place)
  const originalPixels = new Float32Array(pixels)

  // Apply dithering algorithm
  const effectiveAlgorithm = presetData?.settings.algorithm ?? settings.algorithm
  const colorIndices = applyDithering(effectiveAlgorithm, pixels, width, height, palette)

  // Effective settings (merge preset overrides)
  const effectiveSettings: DitherSettings = presetData
    ? { ...settings, ...presetData.settings, paletteMode: 'custom' as const }
    : settings

  // Build ASCII result with original pixels for character mapping
  const result = buildAsciiResult(
    colorIndices,
    width,
    height,
    palette,
    effectiveSettings,
    performance.now() - start,
    originalPixels
  )

  return result
}

// Worker message handler
self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { imageData, settings, id } = e.data

  const result = processImage(imageData, settings)

  const response: WorkerResponse = { type: 'result', result, id }
  self.postMessage(response)
}

// Also export processImage for main-thread fallback
export { processImage }
