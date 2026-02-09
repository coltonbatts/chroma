import { useState, useEffect, useCallback } from 'react'
import './index.css'
import { ColorSwatch } from './components/ColorSwatch'
import { MatchPanel } from './components/MatchPanel'
import { TitleBar } from './components/TitleBar'
import { usePaletteStore } from './lib/store'
import { createColor } from './lib/colorUtils'
import { open } from '@tauri-apps/plugin-dialog'
import { convertFileSrc } from '@tauri-apps/api/core'
import { getCurrentWindow } from '@tauri-apps/api/window'

function App() {
  const { colors, selectedId, selectColor, removeColor, clearPalette, addColor: addColorToStore } = usePaletteStore()

  const [isClient, setIsClient] = useState(import.meta.env.MODE === 'browser')
  // const [colors, setColors] = useState<PaletteColor[]>([]) // REMOVED
  // const [selectedId, setSelectedId] = useState<string | null>(null) // REMOVED
  const [imagePath, setImagePath] = useState<string | null>(null)
  const [pickerColor, setPickerColor] = useState({ r: 128, g: 128, b: 128 })
  const [pickerMode, setPickerMode] = useState<'picker' | 'dropper'>('picker')
  const [showMatchPanel, setShowMatchPanel] = useState(false)

  const handleOpenImage = useCallback(async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{
          name: 'Image',
          extensions: ['png', 'jpg', 'jpeg', 'webp']
        }]
      })

      if (selected && !Array.isArray(selected)) {
        setImagePath(convertFileSrc(selected))
      }
    } catch (e) {
      console.error('Failed to open image:', e)
    }
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

  useEffect(() => {
    setIsClient(true)

    let appWindow: ReturnType<typeof getCurrentWindow> | null = null
    try {
      appWindow = getCurrentWindow()
    } catch (e) {
      console.warn('getCurrentWindow() not available (browser mode):', e)
      return
    }

    // Listen for file drops
    const unlistenDrop = appWindow.listen('tauri://drag-drop', (event: any) => {
      const paths = event.payload?.paths as string[]
      if (paths && paths.length > 0) {
        const path = paths[0]
        if (path.match(/\.(png|jpg|jpeg|webp|gif)$/i)) {
          setImagePath(convertFileSrc(path))
        }
      }
    })

    // Listen for native menu events
    const unlistenMenuOpen = appWindow.listen('menu-open', () => {
      handleOpenImage()
    })
    const unlistenMenuSave = appWindow.listen('menu-save', () => {
      handleSavePalette()
    })

    return () => {
      unlistenDrop.then(fn => fn())
      unlistenMenuOpen.then(fn => fn())
      unlistenMenuSave.then(fn => fn())
    }
  }, [handleOpenImage, handleSavePalette])

  const addColor = useCallback((rgb: { r: number; g: number; b: number }) => {
    const newColor = createColor(rgb.r, rgb.g, rgb.b)
    addColorToStore(newColor)
  }, [addColorToStore])

  // removeColor, selectColor, and clearPalette are now direct from store, 
  // except we need a wrapper for 'handleClearPalette' to match signatures or usage
  // The 'removeColor' and 'selectColor' from store match exactly what we need,
  // but let's check usages.
  // usage: onRemove={... removeColor(color.id)} -> match
  // usage: onSelect={... selectColor(color.id)} -> match

  // We don't need to define them here if we destructured them from store.
  // But wait, removeColor in store takes just ID. The old one was useCallback wrapper.
  // Direct usage is fine.

  // Old saveToStorage helper is removed.

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
    clearPalette()
  }, [clearPalette])

  const selectedColor = colors.find(c => c.id === selectedId)

  if (!isClient) {
    return (
      <div className="h-screen bg-black text-gray-200 flex items-center justify-center">
        <span>Loading...</span>
      </div>
    )
  }

  return (
    <div className="h-screen bg-black text-gray-200 flex flex-col overflow-hidden font-sans">
      <TitleBar />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Nav Bar (Pro Narrow) */}
        <aside className="w-12 flex flex-col items-center py-4 border-r border-gray-800 bg-gray-950/20">
          <nav className="flex flex-col items-center gap-6">
            <button
              onClick={() => setShowMatchPanel(false)}
              className={`p-2 transition-all ${!showMatchPanel ? 'text-white' : 'text-gray-600 hover:text-gray-400'}`}
              title="Palette View"
            >
              <span className="text-xl">◎</span>
            </button>
            <button
              onClick={() => setShowMatchPanel(true)}
              className={`p-2 transition-all ${showMatchPanel ? 'text-white' : 'text-gray-600 hover:text-gray-400'}`}
              title="DMC Matcher"
            >
              <span className="text-xl">◈</span>
            </button>
          </nav>
        </aside>

        {/* Workspace */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Pro Toolbar */}
          <header className="h-10 border-b border-gray-800 flex items-center px-4 gap-6 text-[11px] bg-black/50 backdrop-blur-sm">
            <div className="flex gap-4">
              <button
                onClick={handleOpenImage}
                className="text-gray-400 hover:text-white transition-colors flex items-center gap-1.5"
              >
                <span className="text-lg leading-none">+</span> Open
              </button>
              <button
                onClick={handleSavePalette}
                className="text-gray-400 hover:text-white transition-colors"
              >
                Save
              </button>
            </div>

            <div className="h-4 w-[1px] bg-gray-800 mx-2" />

            <div className="flex gap-4">
              <button
                onClick={() => setPickerMode(pickerMode === 'picker' ? 'dropper' : 'picker')}
                className={`px-2 py-0.5 rounded transition-all ${pickerMode === 'dropper'
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  : 'text-gray-400 hover:text-white border border-transparent'
                  }`}
              >
                {pickerMode === 'dropper' ? '● Eyedropper' : 'Eyedropper'}
              </button>
              <button className="text-gray-500 hover:text-gray-300 transition-colors">Mixer</button>
              <button className="text-gray-500 hover:text-gray-300 transition-colors">Spectrum</button>
            </div>

            <div className="flex-1" />

            <button
              onClick={() => setShowMatchPanel(!showMatchPanel)}
              className={`px-2 py-0.5 rounded transition-all flex items-center gap-2 ${showMatchPanel
                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                : 'text-gray-400 hover:text-white border border-transparent'
                }`}
            >
              DMC MATCH
            </button>
          </header>

          <div className="flex-1 flex overflow-hidden">
            {/* Palette Bar */}
            <aside className="w-56 border-r border-gray-800 flex flex-col bg-gray-950/10">
              <div className="p-3 border-b border-gray-800 flex items-center justify-between">
                <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Palette</span>
                {colors.length > 0 && (
                  <button
                    onClick={handleClearPalette}
                    className="text-[9px] text-gray-600 hover:text-red-400 uppercase tracking-tighter"
                  >
                    Clear All
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
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
              <div className="p-3 border-t border-gray-800">
                <button
                  onClick={() => addColor({ r: pickerColor.r, g: pickerColor.g, b: pickerColor.b })}
                  className="w-full py-2 px-2 text-[10px] bg-gray-800 hover:bg-gray-700 transition-colors border border-gray-700 rounded flex items-center justify-center gap-2 font-bold uppercase tracking-widest"
                >
                  <div
                    className="w-2 h-2 rounded-full border border-gray-500"
                    style={{ backgroundColor: `rgb(${pickerColor.r},${pickerColor.g},${pickerColor.b})` }}
                  />
                  Capture
                </button>
              </div>
            </aside>

            {/* Canvas */}
            <section className="flex-1 bg-[#0a0a0a] flex items-center justify-center relative overflow-hidden group">
              {imagePath ? (
                <div className="relative p-4 w-full h-full flex items-center justify-center">
                  <img
                    src={imagePath}
                    alt="Loaded"
                    className={`max-w-full max-h-full object-contain shadow-2xl transition-all duration-300 ${pickerMode === 'dropper' ? 'cursor-crosshair' : 'cursor-default'}`}
                    onClick={handleImageClick}
                  />
                  {pickerMode === 'dropper' && (
                    <div className="absolute top-4 right-4 pointer-events-none bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded text-[10px] text-blue-400 font-bold uppercase tracking-widest animate-pulse">
                      Dropper Active
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className="flex flex-col items-center gap-8 cursor-pointer group/welcome max-w-sm text-center"
                  onClick={handleOpenImage}
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-gray-500/5 blur-3xl rounded-full scale-150 group-hover/welcome:bg-gray-400/10 transition-all duration-700" />
                    <div className="w-20 h-20 border border-gray-800 rounded-2xl flex items-center justify-center bg-gray-950/50 backdrop-blur-sm group-hover/welcome:border-gray-600 group-hover/welcome:bg-gray-900 transition-all duration-300 relative z-10">
                      <span className="text-3xl text-gray-700 group-hover/welcome:text-gray-400 transition-colors">+</span>
                    </div>
                  </div>
                  <div className="space-y-3 relative z-10">
                    <div className="text-[13px] text-gray-400 font-bold tracking-tight">Drop image or click to begin</div>
                    <div className="flex items-center justify-center gap-3">
                      <div className="px-2 py-0.5 border border-gray-800 rounded bg-gray-950/30 text-[9px] text-gray-600 font-mono uppercase tracking-widest">⌘O</div>
                      <span className="text-gray-800 text-[10px]">•</span>
                      <div className="text-[9px] text-gray-600 uppercase tracking-[0.2em] font-medium">PNG, JPG, WEBP</div>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Selection Details */}
            <aside className="w-64 border-l border-gray-800 flex flex-col bg-gray-950/10">
              {showMatchPanel ? (
                <MatchPanel
                  isOpen={showMatchPanel}
                  selectedColor={selectedColor ? selectedColor.rgb : null}
                  onAddColor={addColor}
                />
              ) : (
                <div className="flex-1 p-5 overflow-y-auto">
                  <div className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-6">Selection</div>
                  {selectedColor ? (
                    <div className="space-y-8">
                      <div
                        className="w-full aspect-square rounded-xl border border-gray-800 shadow-inner overflow-hidden"
                        style={{ backgroundColor: selectedColor.hex }}
                      >
                        <div className="w-full h-full bg-gradient-to-tr from-black/20 to-transparent" />
                      </div>

                      <div className="space-y-4">
                        <div className="group">
                          <span className="text-[9px] text-gray-600 block mb-1 font-mono uppercase">RGB</span>
                          <span className="text-xs font-mono text-gray-300 bg-gray-900/50 p-1.5 rounded block border border-gray-800">
                            {selectedColor.rgb.r}, {selectedColor.rgb.g}, {selectedColor.rgb.b}
                          </span>
                        </div>

                        <div className="group">
                          <span className="text-[9px] text-gray-600 block mb-1 font-mono uppercase">HSL</span>
                          <span className="text-xs font-mono text-gray-300 bg-gray-900/50 p-1.5 rounded block border border-gray-800">
                            {selectedColor.hsl.h}°, {selectedColor.hsl.s}%, {selectedColor.hsl.l}%
                          </span>
                        </div>

                        <div className="group">
                          <span className="text-[9px] text-gray-600 block mb-1 font-mono uppercase">Lab</span>
                          <span className="text-xs font-mono text-gray-300 bg-gray-900/50 p-1.5 rounded block border border-gray-800">
                            L: {selectedColor.lab.l.toFixed(1)} a: {selectedColor.lab.a.toFixed(1)} b: {selectedColor.lab.b.toFixed(1)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between border-t border-gray-800 pt-4 mt-4">
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Luminance</span>
                          <span className="text-xs font-mono text-gray-400">{(selectedColor.luminance * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                      <div className="text-[40px] mb-2">◌</div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-widest">No Selection</div>
                    </div>
                  )}
                </div>
              )}
            </aside>
          </div>
        </main>
      </div>

      {/* Micro Footer */}
      <footer className="h-6 border-t border-gray-800 flex items-center px-4 text-[9px] text-gray-600 bg-black" data-tauri-drag-region>
        <span className="uppercase tracking-widest">{colors.length} colors</span>
        <div className="flex-1" />
        <span className="font-mono opacity-50">{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
      </footer>
    </div>
  )
}

export default App
