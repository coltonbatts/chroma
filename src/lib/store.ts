export interface PaletteColor {
  id: string
  r: number
  g: number
  b: number
  name?: string
}

// Store type (for reference, but persistence is handled in App)
export interface PaletteState {
  colors: PaletteColor[]
  selectedId: string | null
}