import { useEffect } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'

interface TitleBarProps {
  title?: string
}

export function TitleBar({ title = 'Chroma' }: TitleBarProps) {
  let appWindow
  try {
    appWindow = getCurrentWindow()
  } catch (e) {
    console.warn('Failed to get current window:', e)
  }
  useEffect(() => {
    console.log('TitleBar mounted, appWindow:', appWindow)
    if (!appWindow) return

    const checkMaximized = async () => {
      // Internal logic for potential future use
    }
    checkMaximized()

    if (appWindow.onResized) {
      const unlisten = appWindow.onResized(() => {
        checkMaximized()
      })
      return () => {
        unlisten.then(f => f && f())
      }
    }
  }, [appWindow])

  return (
    <div
      className="h-10 flex items-center px-4 bg-black border-b border-gray-800 select-none"
      data-tauri-drag-region
    >
      {/* Traffic lights */}
      <div
        className="flex items-center gap-2 mr-6"
        style={{ WebkitAppRegion: 'no-drag' } as any}
      >
        <button
          className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors flex items-center justify-center group"
          onClick={() => appWindow?.close()}
        >
          <span className="text-[8px] text-red-900 opacity-0 group-hover:opacity-100">×</span>
        </button>
        <button
          className="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-500 transition-colors flex items-center justify-center group"
          onClick={() => appWindow?.minimize()}
        >
          <span className="text-[8px] text-yellow-900 opacity-0 group-hover:opacity-100">−</span>
        </button>
        <button
          className="w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-500 transition-colors flex items-center justify-center group"
          onClick={() => appWindow?.toggleMaximize()}
        >
          <span className="text-[8px] text-green-900 opacity-0 group-hover:opacity-100">+</span>
        </button>
      </div>

      {/* Center Title */}
      <div className="flex-1 text-center pr-20" data-tauri-drag-region>
        <h1 className="text-[10px] font-bold tracking-[0.3em] text-gray-500 uppercase select-none pointer-events-none">
          {title} <span className="text-gray-700 ml-2 font-mono">v0.1.0</span>
        </h1>
      </div>
    </div>
  )
}
