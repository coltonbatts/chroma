import { useState } from 'react'
import { formatRgb, formatHex } from 'culori'

interface ColorSwatchProps {
  color: { id: string; r: number; g: number; b: number; name?: string }
  onRemove: () => void
  isSelected?: boolean
  onSelect?: () => void
}

export function ColorSwatch({ color, onRemove, isSelected, onSelect }: ColorSwatchProps) {
  const [copied, setCopied] = useState<'rgb' | 'hex' | null>(null)
  
  const rgbString = formatRgb({ mode: 'rgb', r: color.r / 255, g: color.g / 255, b: color.b / 255 })
  const hexString = formatHex({ mode: 'rgb', r: color.r / 255, g: color.g / 255, b: color.b / 255 }) || '#000000'
  
  const handleCopy = (e: React.MouseEvent, type: 'rgb' | 'hex') => {
    e.stopPropagation()
    navigator.clipboard.writeText(type === 'rgb' ? rgbString : hexString)
    setCopied(type)
    setTimeout(() => setCopied(null), 1000)
  }
  
  return (
    <div 
      onClick={onSelect}
      className={`
        group flex items-center gap-2 p-1.5 rounded cursor-pointer
        ${isSelected ? 'bg-gray-800 ring-1 ring-gray-500' : 'hover:bg-gray-900'}
      `}
    >
      {/* Color preview */}
      <div 
        className="w-8 h-8 rounded border border-gray-700 shrink-0"
        style={{ backgroundColor: rgbString }}
      />
      
      {/* Color info */}
      <div className="flex-1 min-w-0">
        <div className="text-xs font-mono truncate text-gray-300">
          {hexString.toUpperCase()}
        </div>
        <div className="text-[10px] font-mono truncate text-gray-600">
          {Math.round(color.r)},{Math.round(color.g)},{Math.round(color.b)}
        </div>
      </div>
      
      {/* Actions */}
      <div className="opacity-0 group-hover:opacity-100 flex gap-1">
        <button
          onClick={(e) => handleCopy(e, 'hex')}
          className="p-1 text-gray-600 hover:text-gray-300"
          title="Copy Hex"
        >
          {copied === 'hex' ? '✓' : '#'}
        </button>
        <button
          onClick={(e) => handleCopy(e, 'rgb')}
          className="p-1 text-gray-600 hover:text-gray-300"
          title="Copy RGB"
        >
          {copied === 'rgb' ? '✓' : '📋'}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onRemove() }}
          className="p-1 text-gray-600 hover:text-red-400"
          title="Remove"
        >
          ×
        </button>
      </div>
    </div>
  )
}