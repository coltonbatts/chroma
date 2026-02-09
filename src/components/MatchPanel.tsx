/**
 * DMC Color Match Panel
 * Shows closest DMC floss matches for a selected color
 */

import { useMemo } from 'react'
import { DMCMatch, findClosestDMCColors } from '../lib/dmcFloss'
import { formatHex } from 'culori'

interface MatchPanelProps {
  selectedColor: { r: number; g: number; b: number } | null
  onAddColor: (color: { r: number; g: number; b: number; name?: string }) => void
  isOpen: boolean
}

export function MatchPanel({ selectedColor, onAddColor, isOpen }: MatchPanelProps) {
  const matches = useMemo((): DMCMatch[] => {
    if (!selectedColor) return []
    return findClosestDMCColors(selectedColor, 5)
  }, [selectedColor])

  if (!isOpen) return null

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-gray-800">
        <div className="text-xs text-gray-500 uppercase tracking-wider">DMC Floss Match</div>
      </div>

      {/* Preview color */}
      {selectedColor && (
        <div className="p-3 border-b border-gray-800">
          <div className="flex items-center gap-2 mb-2">
            <div 
              className="w-12 h-12 rounded border border-gray-600"
              style={{ 
                backgroundColor: `rgb(${Math.round(selectedColor.r)},${Math.round(selectedColor.g)},${Math.round(selectedColor.b)})` 
              }}
            />
            <div className="flex-1">
              <div className="text-xs text-gray-500 mb-1">Selected</div>
              <div className="text-xs font-mono text-gray-300">
                {Math.round(selectedColor.r)}, {Math.round(selectedColor.g)}, {Math.round(selectedColor.b)}
              </div>
              <div className="text-xs font-mono text-gray-500">
                {formatHex({ mode: 'rgb', r: selectedColor.r / 255, g: selectedColor.g / 255, b: selectedColor.b / 255 })?.toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No selection message */}
      {!selectedColor && (
        <div className="p-4 text-center">
          <div className="text-gray-500 text-xs mb-2">No color selected</div>
          <div className="text-gray-600 text-[10px]">
            Select a color from the palette to find DMC matches
          </div>
        </div>
      )}

      {/* Matches list */}
      {selectedColor && matches.length > 0 && (
        <div className="flex-1 overflow-y-auto p-2">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 px-1">
            Top {matches.length} Matches
          </div>
          <div className="space-y-1">
            {matches.map((match, index) => (
              <DMCColorCard 
                key={`${match.number}-${index}`}
                match={match}
                onAdd={() => onAddColor({
                  r: match.rgb.r,
                  g: match.rgb.g,
                  b: match.rgb.b,
                  name: `DMC ${match.number} ${match.name}`
                })}
                rank={index + 1}
              />
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      {selectedColor && matches.length > 0 && (
        <div className="p-2 border-t border-gray-800 text-[10px] text-gray-600 text-center">
          Delta-E Lab color matching
        </div>
      )}
    </div>
  )
}

interface DMCColorCardProps {
  match: DMCMatch
  onAdd: () => void
  rank: number
}

function DMCColorCard({ match, onAdd, rank }: DMCColorCardProps) {
  const rgbString = `rgb(${match.rgb.r}, ${match.rgb.g}, ${match.rgb.b})`

  return (
    <div 
      className="group flex items-center gap-2 p-2 rounded bg-gray-900/50 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 cursor-pointer transition-colors"
      onClick={onAdd}
    >
      {/* Rank */}
      <div className="w-5 h-5 flex items-center justify-center text-xs text-gray-600 font-mono">
        {rank}
      </div>

      {/* Color preview */}
      <div 
        className="w-8 h-8 rounded border border-gray-600 shrink-0"
        style={{ backgroundColor: rgbString }}
      />

      {/* Color info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 mb-0.5">
          <span className="text-xs font-bold text-gray-300">{match.number}</span>
          <span className={`text-[9px] px-1 rounded ${match.confidenceBgColor} ${match.confidenceColor}`}>
            {match.confidenceLabel}
          </span>
        </div>
        <div className="text-[10px] text-gray-500 truncate">
          {match.name}
        </div>
        <div className="text-[9px] text-gray-600 font-mono">
          {match.rgb.r}, {match.rgb.g}, {match.rgb.b}
        </div>
      </div>

      {/* Add button */}
      <div className="opacity-0 group-hover:opacity-100">
        <button 
          className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded"
          onClick={(e) => {
            e.stopPropagation()
            onAdd()
          }}
        >
          + Add
        </button>
      </div>
    </div>
  )
}
