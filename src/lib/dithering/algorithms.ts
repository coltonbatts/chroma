// Dithering algorithms — pure functions operating on flat pixel arrays
// All functions modify pixels in-place for performance.
// pixels: flat array [r,g,b,r,g,b,...] (no alpha), width × height × 3

import { RGB } from './types'
import { findClosestColor } from './paletteReduction'

type Pixels = Float32Array

/**
 * Floyd-Steinberg error diffusion dithering.
 * Distributes quantization error to neighboring pixels:
 *   _ X 7/16
 * 3/16 5/16 1/16
 */
export function floydSteinberg(pixels: Pixels, width: number, height: number, palette: RGB[]): Uint8Array {
  const result = new Uint8Array(width * height)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 3
      const oldR = pixels[idx]
      const oldG = pixels[idx + 1]
      const oldB = pixels[idx + 2]

      const ci = findClosestColor(oldR, oldG, oldB, palette)
      result[y * width + x] = ci
      const newC = palette[ci]

      const errR = oldR - newC.r
      const errG = oldG - newC.g
      const errB = oldB - newC.b

      // Distribute error
      if (x + 1 < width) {
        const i = idx + 3
        pixels[i] += errR * 7 / 16
        pixels[i + 1] += errG * 7 / 16
        pixels[i + 2] += errB * 7 / 16
      }
      if (y + 1 < height) {
        if (x - 1 >= 0) {
          const i = ((y + 1) * width + (x - 1)) * 3
          pixels[i] += errR * 3 / 16
          pixels[i + 1] += errG * 3 / 16
          pixels[i + 2] += errB * 3 / 16
        }
        {
          const i = ((y + 1) * width + x) * 3
          pixels[i] += errR * 5 / 16
          pixels[i + 1] += errG * 5 / 16
          pixels[i + 2] += errB * 5 / 16
        }
        if (x + 1 < width) {
          const i = ((y + 1) * width + (x + 1)) * 3
          pixels[i] += errR * 1 / 16
          pixels[i + 1] += errG * 1 / 16
          pixels[i + 2] += errB * 1 / 16
        }
      }
    }
  }

  return result
}

/**
 * Atkinson dithering (used in classic Macintosh).
 * Distributes only 3/4 of the error, creating a lighter result.
 * Pattern:
 *   _ X 1/8 1/8
 * 1/8 1/8 1/8
 *     1/8
 */
export function atkinson(pixels: Pixels, width: number, height: number, palette: RGB[]): Uint8Array {
  const result = new Uint8Array(width * height)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 3
      const oldR = pixels[idx]
      const oldG = pixels[idx + 1]
      const oldB = pixels[idx + 2]

      const ci = findClosestColor(oldR, oldG, oldB, palette)
      result[y * width + x] = ci
      const newC = palette[ci]

      const errR = (oldR - newC.r) / 8
      const errG = (oldG - newC.g) / 8
      const errB = (oldB - newC.b) / 8

      const diffuse = (dx: number, dy: number) => {
        const nx = x + dx
        const ny = y + dy
        if (nx >= 0 && nx < width && ny < height) {
          const i = (ny * width + nx) * 3
          pixels[i] += errR
          pixels[i + 1] += errG
          pixels[i + 2] += errB
        }
      }

      diffuse(1, 0)
      diffuse(2, 0)
      diffuse(-1, 1)
      diffuse(0, 1)
      diffuse(1, 1)
      diffuse(0, 2)
    }
  }

  return result
}

/**
 * Sierra (two-row) dithering.
 * Pattern:
 *     _ X 4/16 3/16
 * 1/16 2/16 3/16 2/16 1/16
 */
export function sierra(pixels: Pixels, width: number, height: number, palette: RGB[]): Uint8Array {
  const result = new Uint8Array(width * height)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 3
      const oldR = pixels[idx]
      const oldG = pixels[idx + 1]
      const oldB = pixels[idx + 2]

      const ci = findClosestColor(oldR, oldG, oldB, palette)
      result[y * width + x] = ci
      const newC = palette[ci]

      const errR = oldR - newC.r
      const errG = oldG - newC.g
      const errB = oldB - newC.b

      const diffuse = (dx: number, dy: number, weight: number) => {
        const nx = x + dx
        const ny = y + dy
        if (nx >= 0 && nx < width && ny < height) {
          const i = (ny * width + nx) * 3
          pixels[i] += errR * weight
          pixels[i + 1] += errG * weight
          pixels[i + 2] += errB * weight
        }
      }

      diffuse(1, 0, 4 / 16)
      diffuse(2, 0, 3 / 16)
      diffuse(-2, 1, 1 / 16)
      diffuse(-1, 1, 2 / 16)
      diffuse(0, 1, 3 / 16)
      diffuse(1, 1, 2 / 16)
      diffuse(2, 1, 1 / 16)
    }
  }

  return result
}

/**
 * Bayer ordered dithering (4×4 matrix).
 * No error diffusion — uses a threshold matrix for fast, patterned results.
 */
const BAYER_4X4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
]

export function bayer(pixels: Pixels, width: number, height: number, palette: RGB[]): Uint8Array {
  const result = new Uint8Array(width * height)
  const spread = 64 // How much the threshold affects color

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 3
      const threshold = (BAYER_4X4[y % 4][x % 4] / 16 - 0.5) * spread

      const r = pixels[idx] + threshold
      const g = pixels[idx + 1] + threshold
      const b = pixels[idx + 2] + threshold

      const ci = findClosestColor(r, g, b, palette)
      result[y * width + x] = ci
    }
  }

  return result
}

/** Run the specified algorithm */
export function applyDithering(
  algorithm: string,
  pixels: Float32Array,
  width: number,
  height: number,
  palette: RGB[]
): Uint8Array {
  switch (algorithm) {
    case 'floyd-steinberg': return floydSteinberg(pixels, width, height, palette)
    case 'atkinson': return atkinson(pixels, width, height, palette)
    case 'sierra': return sierra(pixels, width, height, palette)
    case 'bayer': return bayer(pixels, width, height, palette)
    default: return floydSteinberg(pixels, width, height, palette)
  }
}
