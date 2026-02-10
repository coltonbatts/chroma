import { useState, useEffect, useRef, useCallback } from 'react'
import { DitherWorkspace } from './DitherWorkspace'
import { DitherControlPanel } from './DitherControlPanel'
import { DitherSettings, DitherResult, RGB } from '../lib/dithering/types'
import { PRESETS } from '../lib/dithering/paletteReduction'
import { getPaletteForMode } from '../lib/dithering/paletteReduction'
import { applyDithering } from '../lib/dithering/algorithms'
import { buildAsciiResult } from '../lib/dithering/asciiRenderer'
import { useDitherStore } from '../lib/store'

interface DitherViewProps {
  imageSrc: string | null
  onOpenImage: () => void
}

/** Downsample image data to target columns with aspect correction */
function downsample(
  imageData: ImageData,
  targetCols: number,
  aspectRatio: number
): { pixels: Float32Array; width: number; height: number } {
  const srcW = imageData.width
  const srcH = imageData.height
  const src = imageData.data

  const cellW = srcW / targetCols
  const cellH = cellW / aspectRatio
  const targetRows = Math.max(1, Math.floor(srcH / cellH))

  const pixels = new Float32Array(targetCols * targetRows * 3)

  for (let y = 0; y < targetRows; y++) {
    for (let x = 0; x < targetCols; x++) {
      const sx0 = Math.floor(x * cellW)
      const sy0 = Math.floor(y * cellH)
      const sx1 = Math.min(Math.floor((x + 1) * cellW), srcW)
      const sy1 = Math.min(Math.floor((y + 1) * cellH), srcH)

      let rSum = 0, gSum = 0, bSum = 0, count = 0

      for (let sy = sy0; sy < sy1; sy++) {
        for (let sx = sx0; sx < sx1; sx++) {
          const si = (sy * srcW + sx) * 4
          rSum += src[si]
          gSum += src[si + 1]
          bSum += src[si + 2]
          count++
        }
      }

      if (count > 0) {
        const di = (y * targetCols + x) * 3
        pixels[di] = rSum / count
        pixels[di + 1] = gSum / count
        pixels[di + 2] = bSum / count
      }
    }
  }

  return { pixels, width: targetCols, height: targetRows }
}

export function DitherView({ imageSrc, onOpenImage }: DitherViewProps) {
  const { ditherSettings, setDitherSettings } = useDitherStore()
  const settings = ditherSettings
  const [result, setResult] = useState<DitherResult | null>(null)
  const [imageData, setImageData] = useState<ImageData | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  // Load image into ImageData when src changes
  useEffect(() => {
    if (!imageSrc) {
      setImageData(null)
      setResult(null)
      return
    }

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      setImageData(ctx.getImageData(0, 0, canvas.width, canvas.height))
    }
    img.src = imageSrc
  }, [imageSrc])

  // Process dithering when imageData or settings change (debounced)
  const processImage = useCallback(() => {
    if (!imageData) return

    const start = performance.now()

    // Resolve palette
    const presetData = settings.preset ? PRESETS[settings.preset] : null
    let palette: RGB[]
    if (presetData) {
      palette = presetData.palette
    } else {
      palette = getPaletteForMode(settings.paletteMode, settings.customPalette)
    }

    // Downsample
    const { pixels, width, height } = downsample(imageData, settings.density, settings.aspectRatio)

    // Apply algorithm
    const effectiveAlgorithm = presetData?.settings.algorithm ?? settings.algorithm
    const colorIndices = applyDithering(effectiveAlgorithm, pixels, width, height, palette)

    // Effective settings with preset overrides
    const effectiveSettings: DitherSettings = presetData
      ? { ...settings, ...presetData.settings, paletteMode: 'custom' as const }
      : settings

    const ditherResult = buildAsciiResult(
      colorIndices,
      width,
      height,
      palette,
      effectiveSettings,
      performance.now() - start,
      pixels  // Pass original pixels for character mapping
    )
    setResult(ditherResult)
  }, [imageData, settings])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(processImage, 150)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [processImage])

  const handleSettingsChange = useCallback((partial: Partial<DitherSettings>) => {
    setDitherSettings({ ...settings, ...partial })
  }, [settings, setDitherSettings])

  // Resolve background/foreground colors from preset
  const presetData = settings.preset ? PRESETS[settings.preset] : null
  const bgColor: RGB = presetData?.backgroundColor ?? { r: 0, g: 0, b: 0 }
  const fgColor: RGB | null = presetData?.foregroundColor ?? null

  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <header className="h-10 border-b border-gray-800 flex items-center px-4 gap-4 text-[11px] bg-black/50 backdrop-blur-sm">
          <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Dither Preview</span>
          <button
            onClick={onOpenImage}
            className="text-gray-400 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <span className="text-lg leading-none">+</span> Open Image
          </button>
          <div className="flex-1" />
          {result && (
            <span className="text-[9px] text-gray-600 font-mono">
              {result.cols}×{result.rows} • {result.processingTime.toFixed(0)}ms
            </span>
          )}
        </header>

        {/* Split view */}
        <DitherWorkspace
          imageSrc={imageSrc}
          result={result}
          settings={settings}
          bgColor={bgColor}
          fgColor={fgColor}
          ref={canvasRef}
        />
      </div>

      {/* Right sidebar */}
      <aside className="w-64 border-l border-gray-800 flex flex-col bg-gray-950/10">
        <DitherControlPanel
          settings={settings}
          onSettingsChange={handleSettingsChange}
          result={result}
          previewCanvas={canvasRef.current}
        />
      </aside>
    </div>
  )
}
