import { useState, useEffect, useCallback, useRef } from 'react'
import './index.css'
import { ColorSwatch } from './components/ColorSwatch'
import { MatchPanel } from './components/MatchPanel'
import { MixerPanel } from './components/MixerPanel'
import { SelectionPanel } from './components/SelectionPanel'
import { DitherView } from './components/DitherView'
import { TitleBar } from './components/TitleBar'
import { usePaletteStore, useDitherStore } from './lib/store'
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
  const isPickingRef = useRef(false)
  const { viewMode, setViewMode } = useDitherStore()

  const handleOpenImage = useCallback(async () => {
    // In browser mode, use a file input since Tauri dialog isn't available
    if (import.meta.env.MODE === 'browser') {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/png,image/jpeg,image/webp,image/gif'
      input.onchange = () => {
        const file = input.files?.[0]
        if (file) {
          const url = URL.createObjectURL(file)
          setImagePath(url)
        }
      }
      input.click()
      return
    }

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

    // Browser-mode drag-and-drop
    if (import.meta.env.MODE === 'browser') {
      const handleDragOver = (e: DragEvent) => { e.preventDefault() }
      const handleDrop = (e: DragEvent) => {
        e.preventDefault()
        const file = e.dataTransfer?.files[0]
        if (file && file.type.startsWith('image/')) {
          setImagePath(URL.createObjectURL(file))
        }
      }
      document.addEventListener('dragover', handleDragOver)
      document.addEventListener('drop', handleDrop)
      return () => {
        document.removeEventListener('dragover', handleDragOver)
        document.removeEventListener('drop', handleDrop)
      }
    }

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

  const addColor = useCallback((
    rgb: { r: number; g: number; b: number },
    options?: { select?: boolean }
  ) => {
    const newColor = createColor(rgb.r, rgb.g, rgb.b)
    addColorToStore(newColor)
    if (options?.select) {
      selectColor(newColor.id)
    }
  }, [addColorToStore, selectColor])

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

  const sampleAtEvent = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    try {
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      ctx.drawImage(img, 0, 0)

      const rect = img.getBoundingClientRect()
      const scaleX = img.naturalWidth / rect.width
      const scaleY = img.naturalHeight / rect.height
      const x = (e.clientX - rect.left) * scaleX
      const y = (e.clientY - rect.top) * scaleY
      const px = Math.max(0, Math.min(img.naturalWidth - 1, Math.floor(x)))
      const py = Math.max(0, Math.min(img.naturalHeight - 1, Math.floor(y)))

      const pixel = ctx.getImageData(px, py, 1, 1).data
      setPickerColor({ r: pixel[0], g: pixel[1], b: pixel[2] })
    } catch (err) {
      console.error('Failed to sample color:', err)
    }
  }, [])

  const handleImageMouseDown = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
    if (!imagePath || e.button !== 0) return
    isPickingRef.current = true
    sampleAtEvent(e)
  }, [imagePath, sampleAtEvent])

  const handleImageMouseMove = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
    if (!imagePath || !isPickingRef.current) return
    sampleAtEvent(e)
  }, [imagePath, sampleAtEvent])

  useEffect(() => {
    const onMouseUp = () => { isPickingRef.current = false }
    window.addEventListener('mouseup', onMouseUp)
    return () => window.removeEventListener('mouseup', onMouseUp)
  }, [])

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
              onClick={() => setViewMode('palette')}
              className={`p-2 transition-all ${viewMode === 'palette' ? 'text-white' : 'text-gray-600 hover:text-gray-400'}`}
              title="Palette View"
            >
              <span className="text-xl">◎</span>
            </button>
            <button
              onClick={() => setViewMode('dmc')}
              className={`p-2 transition-all ${viewMode === 'dmc' ? 'text-white' : 'text-gray-600 hover:text-gray-400'}`}
              title="DMC Matcher"
            >
              <span className="text-xl">◈</span>
            </button>
            <button
              onClick={() => setViewMode('mixer')}
              className={`p-2 transition-all ${viewMode === 'mixer' ? 'text-white' : 'text-gray-600 hover:text-gray-400'}`}
              title="Spectral Mixer"
            >
              <span className="text-xl">⊕</span>
            </button>
            <button
              onClick={() => setViewMode('dither')}
              className={`p-2 transition-all ${viewMode === 'dither' ? 'text-white' : 'text-gray-600 hover:text-gray-400'}`}
              title="Dither View"
            >
              <span className="text-xl">◐</span>
            </button>
          </nav>
        </aside>

        {/* Workspace */}
        <main className="flex-1 flex flex-col min-w-0">
          {viewMode === 'dither' ? (
            <DitherView imageSrc={imagePath} onOpenImage={handleOpenImage} />
          ) : (
            <>
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
                  <button
                    onClick={() => setViewMode(viewMode === 'mixer' ? 'palette' : 'mixer')}
                    className={`px-2 py-0.5 rounded transition-all ${viewMode === 'mixer'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'text-gray-400 hover:text-white border border-transparent'
                      }`}
                  >
                    Mixer
                  </button>
                  <button className="text-gray-500 hover:text-gray-300 transition-colors">Spectrum</button>
                </div>

                <div className="flex-1" />

                <button
                  onClick={() => setViewMode(viewMode === 'dmc' ? 'palette' : 'dmc')}
                  className={`px-2 py-0.5 rounded transition-all flex items-center gap-2 ${viewMode === 'dmc'
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
                  <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
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
                        className="max-w-full max-h-full object-contain shadow-2xl transition-all duration-300 cursor-crosshair"
                        onMouseDown={handleImageMouseDown}
                        onMouseMove={handleImageMouseMove}
                      />
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
                  {viewMode === 'dmc' ? (
                    <MatchPanel
                      isOpen={true}
                      selectedColor={selectedColor ? selectedColor.rgb : null}
                      onAddColor={addColor}
                    />
                  ) : viewMode === 'mixer' ? (
                    <MixerPanel
                      isOpen={true}
                      paletteColors={colors}
                      pickerColor={pickerColor}
                      selectedColor={selectedColor ?? null}
                      onAddColor={addColor}
                    />
                  ) : (
                    <SelectionPanel
                      selectedColor={selectedColor}
                      pickerColor={pickerColor}
                    />
                  )}
                </aside>
              </div>
            </>
          )}
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
