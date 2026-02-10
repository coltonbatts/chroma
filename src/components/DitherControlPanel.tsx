import { DitherSettings, DitherAlgorithm, CharacterSetName, PaletteMode, PresetName, DitherResult } from '../lib/dithering/types'
import { PRESETS } from '../lib/dithering/paletteReduction'
import { CHARACTER_SETS } from '../lib/dithering/characterSets'
import { exportAsText, exportAsPng } from '../lib/dithering/asciiRenderer'

interface DitherControlPanelProps {
  settings: DitherSettings
  onSettingsChange: (settings: Partial<DitherSettings>) => void
  result: DitherResult | null
  previewCanvas: HTMLCanvasElement | null
}

const ALGORITHMS: { value: DitherAlgorithm; label: string }[] = [
  { value: 'floyd-steinberg', label: 'Floyd-Steinberg' },
  { value: 'atkinson', label: 'Atkinson' },
  { value: 'sierra', label: 'Sierra' },
  { value: 'bayer', label: 'Bayer 4×4' },
]

const PALETTE_MODES: { value: PaletteMode; label: string }[] = [
  { value: '1-bit', label: '1-bit (B&W)' },
  { value: '2-bit', label: '2-bit (4 grays)' },
  { value: '4-bit', label: '4-bit (16 colors)' },
  { value: 'custom', label: 'Custom' },
]

const FONT_OPTIONS: { value: string; label: string }[] = [
  { value: 'geist-pixel-circle', label: 'Geist Pixel Circle' },
  { value: 'geist-pixel-square', label: 'Geist Pixel Square' },
  { value: 'geist-pixel-grid', label: 'Geist Pixel Grid' },
  { value: 'geist-pixel-line', label: 'Geist Pixel Line' },
  { value: 'geist-pixel-triangle', label: 'Geist Pixel Triangle' },
  { value: 'geist-mono', label: 'Geist Mono' },
  { value: 'monospace', label: 'System Mono' },
]


const PRESET_LIST = Object.values(PRESETS)

function SelectGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[9px] text-gray-500 font-bold tracking-widest uppercase block">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full bg-gray-900 border border-gray-800 rounded px-2 py-1.5 text-[11px] text-gray-300 focus:outline-none focus:border-gray-600"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

function SliderGroup({
  label,
  value,
  min,
  max,
  step,
  onChange,
  displayValue,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  displayValue?: string
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <label className="text-[9px] text-gray-500 font-bold tracking-widest uppercase">{label}</label>
        <span className="text-[10px] text-gray-500 font-mono">{displayValue ?? value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-gray-500"
      />
    </div>
  )
}

export function DitherControlPanel({ settings, onSettingsChange, result, previewCanvas }: DitherControlPanelProps) {
  const handleExportTxt = () => {
    if (!result) return
    const text = exportAsText(result)
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'chroma-ascii.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportPng = async () => {
    if (!previewCanvas) return
    const blob = await exportAsPng(previewCanvas)
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'chroma-ascii.png'
    a.click()
    URL.revokeObjectURL(url)
  }

  const charSetOptions = Object.values(CHARACTER_SETS).map((cs) => ({
    value: cs.name,
    label: cs.label,
  }))

  return (
    <div className="flex flex-col h-full bg-black/20">
      {/* Header */}
      <div className="p-3 border-b border-gray-800">
        <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Dither Controls</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-5 custom-scrollbar">
        {/* Presets */}
        <div className="space-y-1.5">
          <label className="text-[9px] text-gray-500 font-bold tracking-widest uppercase block">Preset</label>
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => onSettingsChange({ preset: null })}
              className={`px-2 py-1.5 text-[10px] rounded border transition-all ${!settings.preset
                ? 'border-gray-500 text-white bg-gray-800'
                : 'border-gray-800 text-gray-500 hover:text-gray-300 hover:border-gray-700'
                }`}
            >
              Custom
            </button>
            {PRESET_LIST.map((p) => (
              <button
                key={p.name}
                onClick={() => onSettingsChange({
                  preset: p.name as PresetName,
                  ...(p.settings as Partial<DitherSettings>),
                  customPalette: p.palette,
                })}
                className={`px-2 py-1.5 text-[10px] rounded border transition-all ${settings.preset === p.name
                  ? 'border-gray-500 text-white bg-gray-800'
                  : 'border-gray-800 text-gray-500 hover:text-gray-300 hover:border-gray-700'
                  }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Algorithm */}
        <SelectGroup
          label="Algorithm"
          value={settings.algorithm}
          options={ALGORITHMS}
          onChange={(v) => onSettingsChange({ algorithm: v, preset: null })}
        />

        {/* Character Set */}
        <SelectGroup
          label="Character Set"
          value={settings.characterSet}
          options={charSetOptions}
          onChange={(v) => onSettingsChange({ characterSet: v as CharacterSetName, preset: null })}
        />

        {/* Palette Mode */}
        <SelectGroup
          label="Palette"
          value={settings.paletteMode}
          options={PALETTE_MODES}
          onChange={(v) => onSettingsChange({ paletteMode: v, preset: null })}
        />

        {/* Font */}
        <SelectGroup
          label="Font"
          value={settings.fontFamily}
          options={FONT_OPTIONS}
          onChange={(v) => onSettingsChange({ fontFamily: v as any, preset: null })}
        />


        {/* Density */}
        <SliderGroup
          label="Density"
          value={settings.density}
          min={20}
          max={200}
          step={1}
          onChange={(v) => onSettingsChange({ density: v })}
          displayValue={`${settings.density} cols`}
        />

        {/* Aspect Ratio */}
        <SliderGroup
          label="Aspect Ratio"
          value={settings.aspectRatio}
          min={0.3}
          max={1.0}
          step={0.05}
          onChange={(v) => onSettingsChange({ aspectRatio: v })}
          displayValue={settings.aspectRatio.toFixed(2)}
        />

        {/* Font Size */}
        <SliderGroup
          label="Font Size"
          value={settings.fontSize}
          min={4}
          max={48}
          step={1}
          onChange={(v) => onSettingsChange({ fontSize: v })}
          displayValue={`${settings.fontSize}px`}
        />

        {/* Invert */}
        <div className="flex items-center justify-between">
          <label className="text-[9px] text-gray-500 font-bold tracking-widest uppercase">Invert</label>
          <button
            onClick={() => onSettingsChange({ invert: !settings.invert })}
            className={`w-8 h-4 rounded-full transition-all relative ${settings.invert ? 'bg-gray-500' : 'bg-gray-800'
              }`}
          >
            <div
              className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-all ${settings.invert ? 'left-4' : 'left-0.5'
                }`}
            />
          </button>
        </div>

        {/* Info */}
        {result && (
          <div className="pt-3 border-t border-gray-800 space-y-1">
            <div className="flex justify-between text-[9px] text-gray-600">
              <span>Size</span>
              <span className="font-mono">{result.cols}×{result.rows}</span>
            </div>
            <div className="flex justify-between text-[9px] text-gray-600">
              <span>Colors</span>
              <span className="font-mono">{result.palette.length}</span>
            </div>
            <div className="flex justify-between text-[9px] text-gray-600">
              <span>Time</span>
              <span className="font-mono">{result.processingTime.toFixed(0)}ms</span>
            </div>
          </div>
        )}
      </div>

      {/* Export */}
      <div className="p-3 border-t border-gray-800 space-y-1.5">
        <button
          onClick={handleExportTxt}
          disabled={!result}
          className="w-full py-1.5 text-[10px] bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:hover:bg-gray-800 transition-colors border border-gray-700 rounded font-bold uppercase tracking-widest"
        >
          Export .txt
        </button>
        <button
          onClick={handleExportPng}
          disabled={!previewCanvas}
          className="w-full py-1.5 text-[10px] bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:hover:bg-gray-800 transition-colors border border-gray-700 rounded font-bold uppercase tracking-widest"
        >
          Export .png
        </button>
      </div>
    </div>
  )
}
