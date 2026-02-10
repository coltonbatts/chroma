import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { DitherResult, DitherSettings, RGB } from '../lib/dithering/types'
import { renderToCanvas } from '../lib/dithering/asciiRenderer'

interface DitherWorkspaceProps {
  imageSrc: string | null
  result: DitherResult | null
  settings: DitherSettings
  bgColor: RGB
  fgColor: RGB | null
}

export const DitherWorkspace = forwardRef<HTMLCanvasElement | null, DitherWorkspaceProps>(
  function DitherWorkspace({ imageSrc, result, settings, bgColor, fgColor }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useImperativeHandle(ref, () => canvasRef.current!, [])

    useEffect(() => {
      if (!result || !canvasRef.current) return
      const ctx = canvasRef.current.getContext('2d')
      if (!ctx) return
      renderToCanvas(ctx, result, settings, bgColor, fgColor)
    }, [result, settings, bgColor, fgColor])

    return (
      <div className="flex-1 flex overflow-hidden">
        {/* Original image */}
        <div className="flex-1 bg-[#0a0a0a] flex items-center justify-center overflow-hidden border-r border-gray-800">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt="Original"
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <div className="text-gray-600 text-xs uppercase tracking-widest">No Image</div>
          )}
        </div>

        {/* ASCII / Dither preview */}
        <div
          className="flex-1 flex items-center justify-center overflow-auto"
          style={{ backgroundColor: `rgb(${bgColor.r},${bgColor.g},${bgColor.b})` }}
        >
          {result ? (
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-full object-contain"
              style={{ imageRendering: 'pixelated' }}
            />
          ) : (
            <div className="text-gray-600 text-xs uppercase tracking-widest">
              {imageSrc ? 'Processing...' : 'Load an image to preview'}
            </div>
          )}
        </div>
      </div>
    )
  }
)
