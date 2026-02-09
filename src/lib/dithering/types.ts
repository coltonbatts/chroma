// Dithering engine type definitions

export type DitherAlgorithm = 'floyd-steinberg' | 'bayer' | 'atkinson' | 'sierra'

export type CharacterSetName = 'dense-to-sparse' | 'box-drawing' | 'braille'

export type PaletteMode = '1-bit' | '2-bit' | '4-bit' | 'custom'

export type PresetName =
  | 'terminal-green'
  | 'amber-crt'
  | 'teletext'
  | '1-bit-mac'
  | 'zx-spectrum'

export interface RGB {
  r: number
  g: number
  b: number
}

export interface DitherSettings {
  algorithm: DitherAlgorithm
  characterSet: CharacterSetName
  paletteMode: PaletteMode
  preset: PresetName | null
  density: number        // 1-200, chars per row
  aspectRatio: number    // 0.3-1.0, default 0.5
  fontSize: number       // 4-16px for canvas rendering
  invert: boolean
  customPalette: RGB[]
}

export interface DitherResult {
  /** ASCII text grid */
  text: string
  /** Flat array of color indices per character */
  colorIndices: number[]
  /** Width in characters */
  cols: number
  /** Height in characters */
  rows: number
  /** The palette used */
  palette: RGB[]
  /** Processing time in ms */
  processingTime: number
}

export interface DitherPreset {
  name: PresetName
  label: string
  settings: Partial<DitherSettings>
  palette: RGB[]
  backgroundColor: RGB
  foregroundColor: RGB
}

export interface WorkerMessage {
  type: 'process'
  imageData: ImageData
  settings: DitherSettings
  id: number
}

export interface WorkerResponse {
  type: 'result'
  result: DitherResult
  id: number
}

export const DEFAULT_DITHER_SETTINGS: DitherSettings = {
  algorithm: 'floyd-steinberg',
  characterSet: 'dense-to-sparse',
  paletteMode: '1-bit',
  preset: null,
  density: 80,
  aspectRatio: 0.5,
  fontSize: 8,
  invert: false,
  customPalette: [],
}
