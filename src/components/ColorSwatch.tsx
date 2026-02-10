import { useState } from 'react'
import { Color } from '../lib/types'

interface ColorSwatchProps {
  color: Color
  onRemove?: () => void
  isSelected?: boolean
  onSelect?: () => void
}

/**
 * Swatch styled like an old manual color reference card—
 * Pantone-style catalog, paint sample chip, or lab color card.
 * Punch-hole, ruled lines, reference-number typography.
 */
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
        group relative flex cursor-pointer transition-all duration-150
        ${isSelected ? 'z-10' : ''}
      `}
    >
      {/* Punch hole (ring-binder style) */}
      <div
        className={`
          absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border-2 shrink-0
          ${isSelected ? 'border-amber-500/60 bg-black' : 'border-gray-700 bg-gray-950'}
          group-hover:border-gray-500
        `}
        style={{ marginLeft: '3px' }}
      />

      {/* Card body */}
      <div
        className={`
          flex-1 ml-3 flex flex-col overflow-hidden
          border border-gray-800 bg-gray-950/80
          transition-all duration-150
          ${isSelected 
            ? 'border-amber-500/40 ring-1 ring-amber-500/20 shadow-lg shadow-black/40' 
            : 'hover:border-gray-700'
          }
        `}
      >
        {/* Color sample strip */}
        <div
          className="w-full h-12 relative"
          style={{ backgroundColor: color.hex }}
        >
          {/* Subtle inner shadow for depth */}
          <div className="absolute inset-0 shadow-inner-soft pointer-events-none" />
        </div>

        {/* Ruled label area */}
        <div className="px-2 py-1.5 border-t border-gray-800/80 flex items-center justify-between gap-2 min-h-[28px]">
          <span
            className={`
              text-[9px] font-mono uppercase tracking-widest truncate
              ${isSelected ? 'text-amber-200' : 'text-gray-400 group-hover:text-gray-300'}
            `}
          >
            {color.hex.replace('#', '')}
          </span>

          {/* Actions */}
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={(e) => handleCopy(e, 'hex')}
              className={`
                w-5 h-5 flex items-center justify-center
                border border-gray-800 rounded-sm
                text-[8px] font-bold
                transition-colors
                ${copied === 'hex' 
                  ? 'bg-green-500/20 border-green-500/40 text-green-400' 
                  : 'bg-gray-900/50 text-gray-500 hover:text-gray-300 hover:border-gray-600'
                }
              `}
              title="Copy HEX"
            >
              {copied === 'hex' ? '✓' : '#'}
            </button>
            {onRemove && (
              <button
                onClick={(e) => { e.stopPropagation(); onRemove() }}
                className="w-5 h-5 flex items-center justify-center rounded-sm border border-gray-800 bg-gray-900/50 text-gray-500 hover:text-red-400 hover:border-red-500/30 text-[10px] leading-none transition-colors"
                title="Remove"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Hover tooltip - catalog detail card */}
      <div className="absolute left-full top-0 ml-2 z-50 hidden group-hover:block w-56">
        <div className="bg-gray-950 border-2 border-gray-800 shadow-xl">
          {/* Header strip */}
          <div className="px-2 py-1 border-b border-gray-800 bg-gray-900/80 text-[8px] uppercase tracking-widest text-gray-500 font-bold">
            Reference
          </div>
          <div className="p-2.5 space-y-2 text-[9px]">
            <div className="flex justify-between gap-4">
              <span className="text-gray-600 uppercase">HEX</span>
              <span className="font-mono text-gray-300">{color.hex.toUpperCase()}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-600 uppercase">RGB</span>
              <span className="font-mono text-gray-400">
                {color.rgb.r}, {color.rgb.g}, {color.rgb.b}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-600 uppercase">HSL</span>
              <span className="font-mono text-gray-400">
                {color.hsl.h}°, {color.hsl.s}%, {color.hsl.l}%
              </span>
            </div>
            <div className="flex justify-between gap-4 border-t border-gray-800 pt-2">
              <span className="text-gray-600 uppercase">Lab</span>
              <span className="font-mono text-gray-400">
                {color.lab.l.toFixed(0)}, {color.lab.a.toFixed(0)}, {color.lab.b.toFixed(0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
