/**
 * Color utility functions
 */

import { parse } from 'culori'
import { Color } from './types'
import { rgbToHex as _rgbToHex, rgbToHsl as _rgbToHsl, rgbToLab as _rgbToLab, getLuminance as _getLuminance } from './conversions'

export const rgbToHex = _rgbToHex
export const rgbToHsl = _rgbToHsl
export const rgbToLab = _rgbToLab
export const getLuminance = _getLuminance

/**
 * Validates if a string is a valid color
 */
export function isValidColor(color: string): boolean {
  return !!parse(color)
}

/**
 * Generates a random Color object
 */
export function generateRandomColor(): Color {
  const r = Math.floor(Math.random() * 256)
  const g = Math.floor(Math.random() * 256)
  const b = Math.floor(Math.random() * 256)

  return createColor(r, g, b)
}

/**
 * Creates a full Color object from RGB values
 */
export function createColor(r: number, g: number, b: number): Color {
  const hex = rgbToHex(r, g, b)
  const hsl = rgbToHsl(r, g, b)
  const lab = rgbToLab(r, g, b)
  const luminance = getLuminance(r, g, b)

  return {
    id: crypto.randomUUID(),
    hex,
    rgb: { r, g, b },
    hsl,
    lab,
    luminance
  }
}

// Re-export DMC specific utilities if needed, or keep them here if they are unique
// The original file had `deltaE` and `getMatchConfidence`. I will keep `deltaE` compatible with the new `Lab` type.

import { Lab } from './types'

/**
 * Simple Euclidean distance in Lab space
 */
export function deltaE(lab1: Lab, lab2: Lab): number {
  const dL = lab1.l - lab2.l
  const da = lab1.a - lab2.a
  const db = lab1.b - lab2.b
  return Math.sqrt(dL * dL + da * da + db * db)
}

/**
 * Get match confidence label and styling based on Delta E distance
 */
export function getMatchConfidence(distance: number): {
  label: string
  color: string
  bgColor: string
} {
  if (distance < 2) {
    return { label: 'Exact', color: 'text-green-400', bgColor: 'bg-green-900/30' }
  } else if (distance < 5) {
    return { label: 'Very Close', color: 'text-green-300', bgColor: 'bg-green-800/30' }
  } else if (distance < 10) {
    return { label: 'Close', color: 'text-yellow-400', bgColor: 'bg-yellow-900/30' }
  } else if (distance < 20) {
    return { label: 'Similar', color: 'text-orange-400', bgColor: 'bg-orange-900/30' }
  } else {
    return { label: 'Distant', color: 'text-gray-400', bgColor: 'bg-gray-800/30' }
  }
}
