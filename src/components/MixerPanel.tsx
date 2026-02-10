import { useState, useEffect, useCallback } from 'react'
import { mixColorsFromHex, paletteFromHex, isSpectralAvailable } from '../lib/spectral/adapter'
import { rgbToHex } from '../lib/conversions'
import { Color } from '../lib/types'

interface MixerPanelProps {
  paletteColors: Color[]
  pickerColor: { r: number; g: number; b: number }
  selectedColor: Color | null
  onAddColor: (color: { r: number; g: number; b: number }) => void
  isOpen: boolean
}

/** Convert RGB to hex for spectral.js */
function rgbToHexSafe(r: number, g: number, b: number): string {
  return rgbToHex(r, g, b)
}

/** Parse hex to RGB 0-255 for createColor */
function hexToRgbValues(hex: string): { r: number; g: number; b: number } {
  const match = hex.replace(/^#/, '').match(/(.{2})(.{2})(.{2})/)
  if (!match) return { r: 0, g: 0, b: 0 }
  return {
    r: parseInt(match[1], 16),
    g: parseInt(match[2], 16),
    b: parseInt(match[3], 16),
  }
}

export function MixerPanel({
  paletteColors,
  pickerColor,
  selectedColor,
  onAddColor,
  isOpen,
}: MixerPanelProps) {
  const [available, setAvailable] = useState<boolean | null>(null)
  const [color1Hex, setColor1Hex] = useState<string>('#E52B21')
  const [color2Hex, setColor2Hex] = useState<string>('#0F2E53')
  const [ratio, setRatio] = useState(50) // 0-100, weight of color1
  const [mixedHex, setMixedHex] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Sync color1/color2 from selected color or picker
  useEffect(() => {
    if (selectedColor) {
      setColor1Hex(selectedColor.hex)
    }
  }, [selectedColor])

  useEffect(() => {
    const hex = rgbToHexSafe(pickerColor.r, pickerColor.g, pickerColor.b)
    const isPickerGray = pickerColor.r === 128 && pickerColor.g === 128 && pickerColor.b === 128
    if (!isPickerGray) {
      setColor2Hex(hex)
    }
  }, [pickerColor.r, pickerColor.g, pickerColor.b])

  // Compute mixed color when ratio or inputs change
  const computeMix = useCallback(async () => {
    if (!available) return
    setError(null)
    try {
      const w1 = ratio / 100
      const w2 = 1 - w1
      const result = await mixColorsFromHex([
        { hex: color1Hex, weight: w1 },
        { hex: color2Hex, weight: w2 },
      ])
      setMixedHex(result.hex)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Mix failed')
      setMixedHex(null)
    }
  }, [available, color1Hex, color2Hex, ratio])

  useEffect(() => {
    isSpectralAvailable().then(setAvailable)
  }, [])

  useEffect(() => {
    computeMix()
  }, [computeMix])

  const handleAddMixed = useCallback(() => {
    if (!mixedHex) return
    const rgb = hexToRgbValues(mixedHex)
    onAddColor(rgb)
  }, [mixedHex, onAddColor])

  const handleAddPalette = useCallback(async () => {
    if (!available || !mixedHex) return
    try {
      const steps = 8
      const palette = await paletteFromHex(color1Hex, color2Hex, steps)
      palette.forEach((hex) => {
        const rgb = hexToRgbValues(hex)
        onAddColor(rgb)
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Palette generation failed')
    }
  }, [available, color1Hex, color2Hex, mixedHex, onAddColor])

  const handleSelectFromPalette = useCallback(
    (color: Color, slot: 1 | 2) => {
      if (slot === 1) setColor1Hex(color.hex)
      else setColor2Hex(color.hex)
    },
    []
  )

  if (!isOpen) return null

  return (
    <div className="flex flex-col h-full bg-black/20">
      <div className="p-3 border-b border-gray-800 flex items-center justify-between">
        <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">
          Spectral Mixer
        </span>
        <a
          href="https://github.com/rvanwijnen/spectral.js"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[8px] text-gray-600 hover:text-gray-400"
        >
          Kubelka-Munk
        </a>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        {available === false ? (
          <div className="flex flex-col items-center justify-center py-8 text-center opacity-60">
            <div className="text-3xl mb-3 text-gray-600">⚠</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-widest">
              Spectral.js failed to load
            </div>
          </div>
        ) : (
          <>
            {/* Color inputs */}
            <div className="grid grid-cols-2 gap-3">
              <ColorSlot
                hex={color1Hex}
                onChange={setColor1Hex}
                label="Color 1"
                paletteColors={paletteColors}
                onSelectFromPalette={(c) => handleSelectFromPalette(c, 1)}
              />
              <ColorSlot
                hex={color2Hex}
                onChange={setColor2Hex}
                label="Color 2"
                paletteColors={paletteColors}
                onSelectFromPalette={(c) => handleSelectFromPalette(c, 2)}
              />
            </div>

            {/* Mix ratio slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-[9px] text-gray-500 uppercase tracking-wider">
                <span>Mix ratio</span>
                <span>{ratio}% / {100 - ratio}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={ratio}
                onChange={(e) => setRatio(Number(e.target.value))}
                className="w-full h-2 accent-amber-500/80 bg-gray-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Result */}
            {error && (
              <div className="text-[10px] text-red-400">{error}</div>
            )}
            {mixedHex && (
              <div className="space-y-3 pt-2 border-t border-gray-800">
                <div className="text-[9px] text-gray-600 uppercase tracking-widest font-bold">
                  Result
                </div>
                <div
                  className="w-full aspect-square rounded-xl border border-gray-800 shadow-inner"
                  style={{ backgroundColor: mixedHex }}
                />
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-gray-400 flex-1 truncate">
                    {mixedHex.toUpperCase()}
                  </span>
                  <button
                    onClick={handleAddMixed}
                    className="px-3 py-1.5 text-[9px] bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded font-bold uppercase tracking-wider transition-colors"
                  >
                    Add to Palette
                  </button>
                </div>
                <button
                  onClick={handleAddPalette}
                  className="w-full py-2 text-[9px] bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded font-bold uppercase tracking-wider transition-colors"
                >
                  Add 8-step gradient to palette
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="p-2.5 border-t border-gray-800 bg-gray-950/30">
        <div className="text-[9px] text-gray-700 text-center uppercase tracking-tighter italic">
          Paint-like mixing via Kubelka-Munk theory
        </div>
      </div>
    </div>
  )
}

interface ColorSlotProps {
  hex: string
  onChange: (hex: string) => void
  label: string
  paletteColors: Color[]
  onSelectFromPalette: (color: Color) => void
}

function ColorSlot({
  hex,
  onChange,
  label,
  paletteColors,
  onSelectFromPalette,
}: ColorSlotProps) {
  const normalizedHex = hex.startsWith('#') ? hex : `#${hex}`

  return (
    <div className="space-y-1.5">
      <div className="text-[9px] text-gray-600 uppercase tracking-wider">{label}</div>
      <div className="flex items-center gap-2">
        <div
          className="w-10 h-10 rounded-lg border border-gray-700 shrink-0"
          style={{ backgroundColor: normalizedHex }}
        />
        <input
          type="text"
          value={normalizedHex}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 text-[10px] font-mono bg-gray-900 border border-gray-800 rounded px-2 py-1.5 text-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-600"
          placeholder="#000000"
        />
      </div>
      {paletteColors.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {paletteColors.slice(0, 6).map((c) => (
            <button
              key={c.id}
              onClick={() => onSelectFromPalette(c)}
              className="w-5 h-5 rounded border border-gray-800 hover:border-gray-600 transition-colors"
              style={{ backgroundColor: c.hex }}
              title={c.hex}
            />
          ))}
        </div>
      )}
    </div>
  )
}
