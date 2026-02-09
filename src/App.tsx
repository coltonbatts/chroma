import { useState, useEffect, useCallback } from 'react'
import { ColorSwatch } from './components/ColorSwatch'
import { MatchPanel } from './components/MatchPanel'
import { PaletteColor } from './lib/store'
import { convertRgbToHsl, convertRgbToLab } from 'culori'
import { invoke } from '@tauri-apps/api/core'

// Window control handlers via Rust backend
const handleClose = () => invoke('close_window')
const handleMinimize = () => invoke('minimize_window')
const handleMaximize = () => invoke('maximize_window')

function App() {
  const [isClient, setIsClient] = useState(false)
  const [colors, setColors] = useState<PaletteColor[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [imagePath, setImagePath] = useState<string | null>(null)
  const [pickerColor, setPickerColor] = useState({ r: 128, g: 128, b: 128 })
  const [pickerMode, setPickerMode] = useState<'picker' | 'dropper'>('picker')
  const [showMatchPanel, setShowMatchPanel] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
    const saved = localStorage.getItem('chroma-palette')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setColors(parsed.state?.colors || [])
        setSelectedId(parsed.state?.selectedId || null)
      } catch (e) {
        console.error('Failed to load palette:', e)
      }
    }
  }, [])
  
  const addColor = useCallback((color: { r: number; g: number; b: number; name?: string }) => {
    const newColor: PaletteColor = {
      ...color,
      id: Math.random().toString(36).substring(2, 9)
    }
    const newColors = [...colors, newColor]
    setColors(newColors)
    saveToStorage(newColors, selectedId)
  }, [colors, selectedId])
  
  const removeColor = useCallback((id: string) => {
    const newColors = colors.filter((c) => c.id !== id)
    setColors(newColors)
    saveToStorage(newColors, selectedId === id ? null : selectedId)
  }, [colors, selectedId])
  
  const selectColor = useCallback((id: string | null) => {
    setSelectedId(id)
    saveToStorage(colors, id)
  }, [colors])
  
  const saveToStorage = (newColors: PaletteColor[], newSelectedId: string | null) => {
    localStorage.setItem('chroma-palette', JSON.stringify({
      state: { colors: newColors, selectedId: newSelectedId }
    }))
  }
  
  const handleOpenImage = useCallback(async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const url = URL.createObjectURL(file)
        setImagePath(url)
      }
    }
    input.click()
  }, [])
  
  const handleSavePalette = useCallback(() => {
    const data = JSON.stringify({ colors }, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'chroma-palette.json'
    a.click()
    URL.revokeObjectURL(url)
  }, [colors])
  
  const handleImageClick = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
    if (!imagePath || pickerMode !== 'dropper') return
    
    const img = e.currentTarget
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    ctx.drawImage(img, 0, 0)
    
    const rect = img.getBoundingClientRect()
    const scaleX = img.naturalWidth / rect.width
    const scaleY = img.naturalHeight / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY
    
    const pixel = ctx.getImageData(x, y, 1, 1).data
    const color = { r: pixel[0], g: pixel[1], b: pixel[2] }
    
    addColor(color)
    setPickerColor(color)
  }, [imagePath, pickerMode, addColor])
  
  const handleClearPalette = useCallback(() => {
    setColors([])
    setSelectedId(null)
    saveToStorage([], null)
  }, [])
  
  const selectedColor = colors.find(c => c.id === selectedId)
  const hslString = selectedColor 
    ? (() => {
        const hsl = convertRgbToHsl({ r: selectedColor.r / 255, g: selectedColor.g / 255, b: selectedColor.b / 255 })
        return `${Math.round((hsl.h ?? 0) * 360)}°, ${Math.round((hsl.s ?? 0) * 100)}%, ${Math.round((hsl.l ?? 0) * 100)}%`
      })()
    : null
  const labString = selectedColor
    ? (() => {
        const lab = convertRgbToLab({ r: selectedColor.r / 255, g: selectedColor.g / 255, b: selectedColor.b / 255 })
        return `L: ${lab.l.toFixed(1)} a: ${lab.a.toFixed(1)} b: ${lab.b.toFixed(1)}`
      })()
    : null
  const luminance = selectedColor
    ? (0.299 * selectedColor.r + 0.587 * selectedColor.g + 0.114 * selectedColor.b) / 255
    : null
  
  if (!isClient) {
    return (
      <div className="h-screen bg-black text-gray-200 flex items-center justify-center">
        <span>Loading...</span>
      </div>
    )
  }
  
  return (
    <div 
      className="h-screen bg-black text-gray-200 flex" 
      style={{ WebkitUserSelect: 'none' }}
    >
      {/* Left Sidebar - Controls + Wordmark + Nav */}
      <aside 
        className="w-16 flex flex-col items-center py-3 border-r border-gray-800"
        data-tauri-drag-region
      >
        {/* Traffic Lights */}
        <div className="flex flex-col gap-2 mb-4">
          <button 
            onClick={handleClose}
            className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 transition-colors"
            title="Close"
          />
          <button 
            onClick={handleMinimize}
            className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-400 transition-colors"
            title="Minimize"
          />
          <button 
            onClick={handleMaximize}
            className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-400 transition-colors"
            title="Maximize"
          />
        </div>
        
        {/* Chroma Wordmark */}
        <div className="mb-4" data-tauri-drag-region>
          <h1 
            className="text-xs font-bold tracking-widest text-gray-200 writing-vertical-rl rotate-180 select-none"
            data-tauri-drag-region
          >
            CHROMA
          </h1>
        </div>
        
        {/* Navigation buttons */}
        <nav className="flex-1 flex flex-col items-center gap-4">
          <button 
            onClick={() => setShowMatchPanel(false)}
            className={`p-2 text-xs ${!showMatchPanel ? 'text-gray-200' : 'text-gray-600 hover:text-gray-400'}`}
            title="Palette"
          >
            ◎
          </button>
          <button 
            onClick={() => setShowMatchPanel(true)}
            className={`p-2 text-xs ${showMatchPanel ? 'text-gray-200' : 'text-gray-600 hover:text-gray-400'}`}
            title="DMC Match"
          >
            ◈
          </button>
        </nav>
        
        {/* Version */}
        <div className="text-[8px] text-gray-700 font-mono writing-vertical-rl rotate-180">
          v0.0.1
        </div>
      </aside>
      
      {/* Main workspace */}
      <div className="flex-1 flex flex-col">
        {/* Left: Palette bar */}
        <aside className="w-64 border-r border-gray-800 flex flex-col">
          <div className="p-3 border-b border-gray-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500 uppercase tracking-wider">Palette</div>
              {colors.length > 0 && (
                <button 
                  onClick={handleClearPalette}
                  className="text-xs text-gray-600 hover:text-red-400"
                >
                  Clear
                </button>
              )}
            </div>
            <button 
              onClick={() => addColor({ r: pickerColor.r, g: pickerColor.g, b: pickerColor.b })}
              className="w-full py-1 px-2 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 flex items-center gap-2"
            >
              <div 
                className="w-4 h-4 rounded border border-gray-600"
                style={{ backgroundColor: `rgb(${pickerColor.r},${pickerColor.g},${pickerColor.b})` }}
              />
              <span>Add Current</span>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {colors.map((color) => (
              <ColorSwatch 
                key={color.id} 
                color={color} 
                isSelected={color.id === selectedId}
                onSelect={() => selectColor(color.id)}
                onRemove={() => removeColor(color.id)}
              />
            ))}
          </div>
        </aside>
        
        {/* Center: Workspace */}
        <main className="flex-1 flex flex-col">
          {/* Toolbar */}
          <div className="h-10 border-b border-gray-800 flex items-center px-4 gap-4 text-xs">
            <div className="relative group">
              <button className="hover:text-white text-gray-400">
                File
              </button>
              <div className="absolute left-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded shadow-lg hidden group-hover:block min-w-32 z-50">
                <button 
                  onClick={handleOpenImage}
                  className="block w-full text-left px-3 py-1.5 hover:bg-gray-700 text-gray-300"
                >
                  Open...
                </button>
                <button 
                  onClick={handleSavePalette}
                  className="block w-full text-left px-3 py-1.5 hover:bg-gray-700 text-gray-300"
                >
                  Save Palette...
                </button>
              </div>
            </div>
            <button className="hover:text-white text-gray-400">Edit</button>
            <button className="hover:text-white text-gray-400">View</button>
            <div className="flex-1" />
            <button 
              onClick={() => setPickerMode(pickerMode === 'picker' ? 'dropper' : 'picker')}
              className={`px-2 py-0.5 border rounded ${
                pickerMode === 'dropper' 
                  ? 'bg-gray-700 border-gray-500 text-white' 
                  : 'border-gray-700 text-gray-400 hover:text-white'
              }`}
            >
              {pickerMode === 'dropper' ? '● Dropper' : '○ Dropper'}
            </button>
            <button className="hover:text-white text-gray-400">Mix</button>
            <button className="hover:text-white text-gray-400">Spectrum</button>
            <button 
              onClick={() => setShowMatchPanel(!showMatchPanel)}
              className={`px-2 py-0.5 border rounded ${
                showMatchPanel 
                  ? 'bg-gray-700 border-gray-500 text-white' 
                  : 'border-gray-700 text-gray-400 hover:text-white'
              }`}
            >
              {showMatchPanel ? '● Match' : '○ Match'}
            </button>
          </div>
          
          {/* Canvas / Image area */}
          <div className="flex-1 bg-black flex items-center justify-center relative overflow-hidden">
            {imagePath ? (
              <img 
                src={imagePath} 
                alt="Loaded"
                className={`max-w-full max-h-full object-contain cursor-${pickerMode === 'dropper' ? 'crosshair' : 'default'}`}
                onClick={handleImageClick}
              />
            ) : (
              <div className="text-gray-600 text-sm flex flex-col items-center gap-2">
                <span>Workspace ready.</span>
                <span className="text-gray-500">Drop image or File → Open</span>
              </div>
            )}
          </div>
        </main>
        
        {/* Right: Info panel */}
        <aside className="w-56 border-l border-gray-800 flex flex-col">
          {showMatchPanel ? (
            <MatchPanel
              isOpen={showMatchPanel}
              selectedColor={selectedColor ? { r: selectedColor.r, g: selectedColor.g, b: selectedColor.b } : null}
              onAddColor={addColor}
            />
          ) : (
            <div className="flex-1 p-4">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-4">Current Selection</div>
              {selectedColor ? (
                <div className="space-y-4">
                  <div 
                    className="w-full aspect-square rounded border border-gray-700"
                    style={{ backgroundColor: `rgb(${selectedColor.r},${selectedColor.g},${selectedColor.b})` }}
                  />
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">RGB</span>
                      <span className="font-mono">{Math.round(selectedColor.r)}, {Math.round(selectedColor.g)}, {Math.round(selectedColor.b)}</span>
                    </div>
                    {hslString && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">HSL</span>
                        <span className="font-mono">{hslString}</span>
                      </div>
                    )}
                    {labString && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Lab</span>
                        <span className="font-mono">{labString}</span>
                      </div>
                    )}
                    {luminance !== null && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Lum</span>
                        <span className="font-mono">{(luminance * 100).toFixed(1)}%</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-gray-600 text-xs">No selection</div>
              )}
            </div>
          )}
        </aside>
      </div>
      
      {/* Footer */}
      <footer className="h-6 border-t border-gray-800 flex items-center px-4 text-xs text-gray-600" data-tauri-drag-region>
        <span>{colors.length} color{colors.length !== 1 ? 's' : ''} in palette</span>
        <span className="mx-2">•</span>
        <span className="font-mono">{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
      </footer>
    </div>
  )
}

export default App
