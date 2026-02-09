import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { Color } from './types'
import { createColor } from './colorUtils'
import { DitherSettings, DEFAULT_DITHER_SETTINGS } from './dithering/types'

// View mode for the application
export type ViewMode = 'palette' | 'dmc' | 'dither'

// Dither settings store (separate, persisted)
export interface DitherStoreState {
  viewMode: ViewMode
  ditherSettings: DitherSettings
  setViewMode: (mode: ViewMode) => void
  setDitherSettings: (settings: DitherSettings) => void
}

export const useDitherStore = create<DitherStoreState>()(
  persist(
    (set) => ({
      viewMode: 'palette' as ViewMode,
      ditherSettings: DEFAULT_DITHER_SETTINGS,
      setViewMode: (mode) => set({ viewMode: mode }),
      setDitherSettings: (settings) => set({ ditherSettings: settings }),
    }),
    {
      name: 'chroma-dither',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

// Define the store state and actions
export interface PaletteState {
  colors: Color[]
  selectedId: string | null

  // Actions
  addColor: (color: Color) => void
  removeColor: (id: string) => void
  updateColor: (id: string, updates: Partial<Color>) => void
  selectColor: (id: string | null) => void
  setColors: (colors: Color[]) => void
  clearPalette: () => void
}

export const usePaletteStore = create<PaletteState>()(
  persist(
    (set) => ({
      colors: [],
      selectedId: null,

      addColor: (color) => set((state) => ({
        colors: [...state.colors, color]
      })),

      removeColor: (id) => set((state) => {
        const newColors = state.colors.filter((c) => c.id !== id)
        // If removing selected color, deselect it
        const newSelectedId = state.selectedId === id ? null : state.selectedId
        return { colors: newColors, selectedId: newSelectedId }
      }),

      updateColor: (id, updates) => set((state) => ({
        colors: state.colors.map((c) => (c.id === id ? { ...c, ...updates } : c))
      })),

      selectColor: (id) => set({ selectedId: id }),

      setColors: (colors) => set({ colors }),

      clearPalette: () => set({ colors: [], selectedId: null }),
    }),
    {
      name: 'chroma-palette', // localStorage key
      storage: createJSONStorage(() => localStorage),
      // Basic migration to ensure colors have full structure
      migrate: (persistedState: any, version) => {
        try {
          console.log('Zustand Migrate: version', version, 'state', persistedState)
          if (version === 0 || version === undefined) {
            // Check if colors need migration (e.g. missing lab/luminance)
            const state = persistedState as PaletteState
            if (state && state.colors) {
              state.colors = state.colors.map((c: any) => {
                // Re-generate full color object if missing properties but has RGB
                if ((!c.lab || !c.hsl) && c.rgb) {
                  const newCol = createColor(c.rgb.r, c.rgb.g, c.rgb.b)
                  newCol.id = c.id // Keep existing ID
                  if (c.name) { (newCol as any).name = c.name } // Keep legacy name if exists
                  return newCol
                }
                // Handle very old legacy {r,g,b} format
                if (c.r !== undefined && c.g !== undefined && c.b !== undefined && !c.rgb) {
                  const newCol = createColor(c.r, c.g, c.b)
                  newCol.id = c.id
                  return newCol
                }
                return c
              })
            }
            return state
          }
        } catch (e) {
          console.error('Migration failed:', e)
        }
        return persistedState
      },
      version: 0, // Keep at 0 for now to match default behavior or bump if we want to force migration logic to run on existing data
    }
  )
)