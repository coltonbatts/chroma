// Palette reduction and preset palettes

import { RGB, PaletteMode, DitherPreset, PresetName } from './types'

/** Convert RGB to grayscale luminance 0-255 */
export function luminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b
}

/** Find the closest color in a palette using Euclidean distance */
export function findClosestColor(r: number, g: number, b: number, palette: RGB[]): number {
  let minDist = Infinity
  let bestIdx = 0
  for (let i = 0; i < palette.length; i++) {
    const dr = r - palette[i].r
    const dg = g - palette[i].g
    const db = b - palette[i].b
    const dist = dr * dr + dg * dg + db * db
    if (dist < minDist) {
      minDist = dist
      bestIdx = i
    }
  }
  return bestIdx
}

/** Generate a palette for the given mode */
export function getPaletteForMode(mode: PaletteMode, customPalette: RGB[]): RGB[] {
  switch (mode) {
    case '1-bit':
      return [{ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 }]
    case '2-bit':
      return [
        { r: 0, g: 0, b: 0 },
        { r: 85, g: 85, b: 85 },
        { r: 170, g: 170, b: 170 },
        { r: 255, g: 255, b: 255 },
      ]
    case '4-bit':
      return [
        { r: 0, g: 0, b: 0 }, { r: 0, g: 0, b: 170 },
        { r: 0, g: 170, b: 0 }, { r: 0, g: 170, b: 170 },
        { r: 170, g: 0, b: 0 }, { r: 170, g: 0, b: 170 },
        { r: 170, g: 85, b: 0 }, { r: 170, g: 170, b: 170 },
        { r: 85, g: 85, b: 85 }, { r: 85, g: 85, b: 255 },
        { r: 85, g: 255, b: 85 }, { r: 85, g: 255, b: 255 },
        { r: 255, g: 85, b: 85 }, { r: 255, g: 85, b: 255 },
        { r: 255, g: 255, b: 85 }, { r: 255, g: 255, b: 255 },
      ]
    case 'custom':
      return customPalette.length > 0
        ? customPalette
        : [{ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 }]
  }
}

// Preset definitions

const ZX_SPECTRUM_COLORS: RGB[] = [
  { r: 0, g: 0, b: 0 }, { r: 0, g: 0, b: 215 },
  { r: 215, g: 0, b: 0 }, { r: 215, g: 0, b: 215 },
  { r: 0, g: 215, b: 0 }, { r: 0, g: 215, b: 215 },
  { r: 215, g: 215, b: 0 }, { r: 215, g: 215, b: 215 },
  { r: 0, g: 0, b: 255 }, { r: 255, g: 0, b: 0 },
  { r: 255, g: 0, b: 255 }, { r: 0, g: 255, b: 0 },
  { r: 0, g: 255, b: 255 }, { r: 255, g: 255, b: 0 },
  { r: 255, g: 255, b: 255 },
]

const TELETEXT_COLORS: RGB[] = [
  { r: 0, g: 0, b: 0 }, { r: 255, g: 0, b: 0 },
  { r: 0, g: 255, b: 0 }, { r: 255, g: 255, b: 0 },
  { r: 0, g: 0, b: 255 }, { r: 255, g: 0, b: 255 },
  { r: 0, g: 255, b: 255 }, { r: 255, g: 255, b: 255 },
]

export const PRESETS: Record<PresetName, DitherPreset> = {
  'terminal-green': {
    name: 'terminal-green',
    label: 'Terminal Green',
    settings: {
      algorithm: 'floyd-steinberg',
      characterSet: 'dense-to-sparse',
      paletteMode: 'custom',
    },
    palette: [{ r: 0, g: 0, b: 0 }, { r: 0, g: 255, b: 0 }],
    backgroundColor: { r: 0, g: 0, b: 0 },
    foregroundColor: { r: 0, g: 255, b: 0 },
  },
  'amber-crt': {
    name: 'amber-crt',
    label: 'Amber CRT',
    settings: {
      algorithm: 'floyd-steinberg',
      characterSet: 'dense-to-sparse',
      paletteMode: 'custom',
    },
    palette: [{ r: 0, g: 0, b: 0 }, { r: 255, g: 176, b: 0 }],
    backgroundColor: { r: 0, g: 0, b: 0 },
    foregroundColor: { r: 255, g: 176, b: 0 },
  },
  'teletext': {
    name: 'teletext',
    label: 'Teletext',
    settings: {
      algorithm: 'bayer',
      characterSet: 'box-drawing',
      paletteMode: 'custom',
    },
    palette: TELETEXT_COLORS,
    backgroundColor: { r: 0, g: 0, b: 0 },
    foregroundColor: { r: 255, g: 255, b: 255 },
  },
  '1-bit-mac': {
    name: '1-bit-mac',
    label: '1-bit Mac',
    settings: {
      algorithm: 'atkinson',
      characterSet: 'dense-to-sparse',
      paletteMode: '1-bit',
    },
    palette: [{ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 }],
    backgroundColor: { r: 255, g: 255, b: 255 },
    foregroundColor: { r: 0, g: 0, b: 0 },
  },
  'zx-spectrum': {
    name: 'zx-spectrum',
    label: 'ZX Spectrum',
    settings: {
      algorithm: 'floyd-steinberg',
      characterSet: 'box-drawing',
      paletteMode: 'custom',
    },
    palette: ZX_SPECTRUM_COLORS,
    backgroundColor: { r: 0, g: 0, b: 0 },
    foregroundColor: { r: 255, g: 255, b: 255 },
  },
}
