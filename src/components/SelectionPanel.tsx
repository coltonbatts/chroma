import { createColor } from '../lib/colorUtils'
import { Color } from '../lib/types'

interface SelectionPanelProps {
  selectedColor: Color | undefined
  pickerColor: { r: number; g: number; b: number }
}

/**
 * Displays the current color (from palette selection or image sampling).
 * Sampled color is locked when you release mouse after click+drag.
 */
export function SelectionPanel({
  selectedColor,
  pickerColor,
}: SelectionPanelProps) {
  const displayColor = selectedColor
    ? selectedColor
    : createColor(pickerColor.r, pickerColor.g, pickerColor.b)

  return (
    <div className="flex-1 p-5 overflow-y-auto flex flex-col">
      <div className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-6 flex items-center justify-between">
        <span>
          {selectedColor ? 'Selection' : 'Sampled'}
        </span>
      </div>

      <div className="space-y-8">
        <div
          className="w-full aspect-square rounded-xl border border-gray-800 shadow-inner overflow-hidden"
          style={{ backgroundColor: displayColor.hex }}
        >
          <div className="w-full h-full bg-gradient-to-tr from-black/20 to-transparent" />
        </div>

        <div className="space-y-4">
          <div className="group">
            <span className="text-[9px] text-gray-600 block mb-1 font-mono uppercase">RGB</span>
            <span className="text-xs font-mono text-gray-300 bg-gray-900/50 p-1.5 rounded block border border-gray-800">
              {displayColor.rgb.r}, {displayColor.rgb.g}, {displayColor.rgb.b}
            </span>
          </div>

          <div className="group">
            <span className="text-[9px] text-gray-600 block mb-1 font-mono uppercase">HSL</span>
            <span className="text-xs font-mono text-gray-300 bg-gray-900/50 p-1.5 rounded block border border-gray-800">
              {displayColor.hsl.h}°, {displayColor.hsl.s}%, {displayColor.hsl.l}%
            </span>
          </div>

          <div className="group">
            <span className="text-[9px] text-gray-600 block mb-1 font-mono uppercase">Lab</span>
            <span className="text-xs font-mono text-gray-300 bg-gray-900/50 p-1.5 rounded block border border-gray-800">
              L: {displayColor.lab.l.toFixed(1)} a: {displayColor.lab.a.toFixed(1)} b: {displayColor.lab.b.toFixed(1)}
            </span>
          </div>

          <div className="flex items-center justify-between border-t border-gray-800 pt-4 mt-4">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Luminance</span>
            <span className="text-xs font-mono text-gray-400">{(displayColor.luminance * 100).toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}
