// Character sets ordered by visual density (dark → light)

import { CharacterSetName } from './types'

export interface CharacterSet {
  name: CharacterSetName
  label: string
  chars: string[]  // Ordered dark → light (most dense first)
}

// Dense-to-sparse: standard ASCII density ramp
const DENSE_TO_SPARSE: CharacterSet = {
  name: 'dense-to-sparse',
  label: 'Standard',
  chars: [
    '@', '#', 'W', 'M', 'B', '8', '&', '%', '$',
    'X', 'D', 'Q', 'O', '0', 'Z', 'U', 'J', 'C',
    'L', 'Y', 'T', '{', '/', '\\', '|', '(', ')',
    '1', 'j', 'i', 'l', '!', ';', ':', ',', '"',
    '^', '`', "'", '.', ' ',
  ],
}

// Box-drawing: creates blocky, retro look
const BOX_DRAWING: CharacterSet = {
  name: 'box-drawing',
  label: 'Box Drawing',
  chars: [
    '█', '▓', '▒', '░', '▐', '▌', '▀', '▄',
    '■', '□', '▪', '▫', '●', '○', '◆', '◇',
    '◼', '◻', '▣', '▢', '▩', '▨', '▧', '▦',
    '╳', '╬', '╪', '┼', '─', '│', '·', ' ',
  ],
}

// Braille: very fine detail, 2×4 dot patterns
const BRAILLE: CharacterSet = {
  name: 'braille',
  label: 'Braille',
  chars: [
    '⣿', '⣷', '⣯', '⣟', '⡿', '⢿', '⣻', '⣽',
    '⣾', '⣶', '⣮', '⣞', '⡾', '⢾', '⣺', '⣼',
    '⣤', '⣠', '⣄', '⡤', '⢤', '⣰', '⣸', '⣴',
    '⡆', '⢰', '⡄', '⢠', '⡀', '⢀', '⠁', '⠂',
    '⠄', '⠈', '⠐', '⠠', ' ',
  ],
}

export const CHARACTER_SETS: Record<CharacterSetName, CharacterSet> = {
  'dense-to-sparse': DENSE_TO_SPARSE,
  'box-drawing': BOX_DRAWING,
  'braille': BRAILLE,
}

/**
 * Map a luminance value (0-255) to a character.
 * 0 = darkest (most dense char), 255 = lightest (space).
 * If invert is true, mapping is reversed.
 */
export function luminanceToChar(lum: number, charSet: CharacterSet, invert: boolean): string {
  const chars = charSet.chars
  let normalized = Math.max(0, Math.min(255, lum)) / 255
  if (invert) normalized = 1 - normalized
  const index = Math.min(Math.floor(normalized * chars.length), chars.length - 1)
  return chars[index]
}

/**
 * Map a palette index to a character based on palette color luminance.
 */
export function paletteIndexToChar(
  colorIndex: number,
  palette: { r: number; g: number; b: number }[],
  charSet: CharacterSet,
  invert: boolean
): string {
  const c = palette[colorIndex]
  const lum = 0.299 * c.r + 0.587 * c.g + 0.114 * c.b
  return luminanceToChar(lum, charSet, invert)
}
