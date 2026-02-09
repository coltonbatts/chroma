/**
 * Custom Title Bar for Chroma
 * Replaces native macOS title bar with our own black design
 */

import { useEffect, useState } from 'react'

interface TitleBarProps {
  title?: string
}

export function TitleBar({ title = 'Chroma' }: TitleBarProps) {
  const [isMaximized, setIsMaximized] = useState(false)

  // Listen for window maximize state changes
  useEffect(() => {
    // This would need Tauri API calls for real window control
    // For now, just show the UI
  }, [])

  return (
    <div 
      className="h-10 flex items-center px-3 bg-black border-b border-gray-800 select-none"
      style={{ 
        WebkitAppRegion: 'drag',
        paddingTop: 'env(safe-area-inset-top, 0px)'
      }}
    >
      {/* Traffic lights */}
      <div 
        className="flex items-center gap-2 mr-4"
        style={{ WebkitAppRegion: 'no-drag' }}
      >
        {/* Close */}
        <button
          className="w-3 h-3 rounded-full bg-gray-600 hover:bg-red-500 transition-colors"
          onClick={() => {
            // Would close window via Tauri API
            window.close?.()
          }}
        />
        {/* Minimize */}
        <button
          className="w-3 h-3 rounded-full bg-gray-600 hover:bg-yellow-500 transition-colors"
          onClick={() => {
            // Would minimize via Tauri API  
            window.minimize?.()
          }}
        />
        {/* Maximize */}
        <button
          className="w-3 h-3 rounded-full bg-gray-600 hover:bg-green-500 transition-colors"
          onClick={() => {
            setIsMaximized(!isMaximized)
            // Would toggle maximize via Tauri API
            window.maximize?.()
          }}
        />
      </div>

      {/* Title */}
      <div className="flex-1 text-center">
        <h1 className="text-sm font-bold tracking-[0.2em] text-gray-200 uppercase">
          {title}
        </h1>
      </div>

      {/* Spacer for symmetry */}
      <div className="w-12" />
    </div>
  )
}

// These would be Tauri window API calls
declare global {
  interface Window {
    close?: () => void
    minimize?: () => void
    maximize?: () => void
  }
}
