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
    return findClosestDMCColors(selectedColor, 8)
  }, [selectedColor])

  if (!isOpen) return null

  return (
    <div className="flex flex-col h-full bg-black/20">
      {/* Header */}
      <div className="p-3 border-b border-gray-800 flex items-center justify-between">
        <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">DMC Matcher</span>
        {selectedColor && (
          <span className="text-[9px] text-gray-600 font-mono">
            {formatHex({ mode: 'rgb', r: selectedColor.r / 255, g: selectedColor.g / 255, b: selectedColor.b / 255 })?.toUpperCase()}
          </span>
        )}
      </div>

      {/* Matches content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {!selectedColor ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center opacity-40">
            <div className="text-3xl mb-3 text-gray-700">◈</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-widest leading-relaxed">
              Select a color to find matches
            </div>
          </div>
        ) : (
          <div className="p-2 space-y-1.5">
            <div className="px-2 py-1 text-[9px] text-gray-600 uppercase tracking-widest font-bold">Top Suggestions</div>
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
        )}
      </div>

      {/* Footer */}
      <div className="p-2.5 border-t border-gray-800 bg-gray-950/30">
        <div className="text-[9px] text-gray-700 text-center uppercase tracking-tighter italic">
          Delta-E Lab Color Matching Engine
        </div>
      </div>
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
      className="group flex items-center gap-3 p-2 rounded-lg bg-gray-900/40 hover:bg-gray-800/80 border border-gray-800 hover:border-gray-700 cursor-pointer transition-all duration-200"
      onClick={onAdd}
    >
      {/* Color preview */}
      <div className="relative shrink-0">
        <div
          className="w-10 h-10 rounded-md border border-white/5 shadow-md group-hover:scale-105 transition-transform"
          style={{ backgroundColor: rgbString }}
        />
        <div className="absolute -top-1 -left-1 w-4 h-4 bg-black border border-gray-800 rounded-full flex items-center justify-center text-[8px] text-gray-500 font-mono shadow-sm">
          {rank}
        </div>
      </div>

      {/* Color info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-xs font-bold text-gray-300 group-hover:text-white transition-colors">{match.number}</span>
          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${match.confidenceBgColor.replace('bg-', 'bg-').replace('text-', 'border-').replace('100', '500/10')} ${match.confidenceColor}`}>
            {match.confidenceLabel}
          </span>
        </div>
        <div className="text-[10px] text-gray-500 truncate group-hover:text-gray-400 transition-colors uppercase tracking-tight">
          {match.name}
        </div>
        <div className="text-[9px] text-gray-700 font-mono mt-1">
          Δe {match.distance.toFixed(1)}
        </div>
      </div>

      {/* Add indicator */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity pr-1 text-gray-500">
        <span className="text-lg">+</span>
      </div>
    </div>
  )
}
