/**
 * Color utility functions for DMC matching
 */

import { convertRgbToLab } from 'culori'

export interface Lab {
  mode: 'lab'
  l: number
  a: number
  b: number
  alpha?: number
}

/**
 * Convert RGB to Lab color space for perceptual color matching
 */
export function rgbToLab(r: number, g: number, b: number): Lab {
  return convertRgbToLab({ r: r / 255, g: g / 255, b: b / 255 }) as Lab
}

/**
 * Simple Euclidean distance in Lab space (faster than CIEDE2000)
 * For better perceptual accuracy, consider implementing full CIEDE2000
 */
export function deltaE(lab1: Lab, lab2: Lab): number {
  const dL = lab2.l - lab1.l
  const da = lab2.a - lab1.a
  const db = lab2.b - lab1.b
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
