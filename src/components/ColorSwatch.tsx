import { useState } from 'react'
import { Color } from '../lib/types'

interface ColorSwatchProps {
  color: Color
  onRemove?: () => void
  isSelected?: boolean
  onSelect?: () => void
}

export function ColorSwatch({ color, onRemove, isSelected, onSelect }: ColorSwatchProps) {
  const [copied, setCopied] = useState<'rgb' | 'hex' | null>(null)

  const handleCopy = (e: React.MouseEvent, type: 'rgb' | 'hex') => {
    e.stopPropagation()
    const text = type === 'rgb'
      ? `rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`
      : color.hex
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div
      onClick={onSelect}
      className={`
        group relative flex items-center gap-2.5 p-1.5 rounded-md cursor-pointer transition-all duration-150
        ${isSelected ? 'bg-gray-800/80 ring-1 ring-gray-700 shadow-lg' : 'hover:bg-gray-900/60'}
      `}
    >
      {/* Color preview */}
      <div
        className="w-7 h-7 rounded border border-white/5 shrink-0 shadow-sm transition-transform group-hover:scale-105"
        style={{ backgroundColor: color.hex }}
      />

      {/* Color info */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <span className={`text-[10px] font-bold font-mono transition-colors ${isSelected ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'}`}>
          {color.hex.toUpperCase()}
        </span>
      </div>

      {/* Hover Tooltip/Details */}
      <div className="absolute left-full top-0 ml-2 z-50 hidden group-hover:block w-max">
        <div className="bg-gray-900 border border-gray-800 rounded-lg shadow-xl p-3 text-[10px] space-y-1.5 backdrop-blur-sm">
          <div className="font-bold text-gray-300 border-b border-gray-800 pb-1 mb-1">Color Details</div>

          <div className="grid grid-cols-[20px_1fr] gap-2">
            <span className="text-gray-500 font-mono">HEX</span>
            <span className="font-mono text-gray-400">{color.hex.toUpperCase()}</span>
          </div>

          <div className="grid grid-cols-[20px_1fr] gap-2">
            <span className="text-gray-500 font-mono">RGB</span>
            <span className="font-mono text-gray-400">
              {color.rgb.r}, {color.rgb.g}, {color.rgb.b}
            </span>
          </div>

          <div className="grid grid-cols-[20px_1fr] gap-2">
            <span className="text-gray-500 font-mono">HSL</span>
            <span className="font-mono text-gray-400">
              {color.hsl.h}°, {color.hsl.s}%, {color.hsl.l}%
            </span>
          </div>

          <div className="grid grid-cols-[20px_1fr] gap-2">
            <span className="text-gray-500 font-mono">LAB</span>
            <span className="font-mono text-gray-400">
              {color.lab.l.toFixed(0)}, {color.lab.a.toFixed(0)}, {color.lab.b.toFixed(0)}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
        <button
          onClick={(e) => handleCopy(e, 'hex')}
          className={`w-6 h-6 flex items-center justify-center rounded hover:bg-white/5 text-[9px] font-bold ${copied === 'hex' ? 'text-green-400' : 'text-gray-500 hover:text-gray-300'}`}
          title="Copy HEX"
        >
          {copied === 'hex' ? '✓' : '#'}
        </button>
        {onRemove && (
          <button
            onClick={(e) => { e.stopPropagation(); onRemove() }}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-500/10 text-gray-600 hover:text-red-400 text-lg leading-none"
            title="Remove"
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}