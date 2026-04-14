import { useState } from 'react'

interface Props {
  cols: number
  setCols: (v: number) => void
  contrast: number
  setContrast: (v: number) => void
  invert: boolean
  setInvert: (v: boolean) => void
  customChars: string
  setCustomChars: (v: string) => void
}

export function ParamPanel(props: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-6 right-8 z-50 w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 transition-colors"
        aria-label="Parameters"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M6 2v4M6 10v4M10 2v8M10 14v0M4 6h4M8 10h4" />
        </svg>
      </button>

      <div
        className={`
          fixed top-0 right-0 h-full w-72 bg-white border-l border-neutral-100
          transform transition-transform duration-300 z-40 p-8 pt-20
          ${open ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <h3 className="text-xs font-medium tracking-widest text-neutral-400 uppercase mb-8">
          Parameters
        </h3>

        <label className="block mb-6">
          <span className="text-xs text-neutral-500 block mb-2">Density (columns)</span>
          <input
            type="range"
            min={20}
            max={200}
            value={props.cols}
            onChange={(e) => props.setCols(Number(e.target.value))}
            className="w-full accent-neutral-800"
          />
          <span className="text-xs text-neutral-400 mt-1 block">{props.cols}</span>
        </label>

        <label className="block mb-6">
          <span className="text-xs text-neutral-500 block mb-2">Contrast</span>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(props.contrast * 100)}
            onChange={(e) => props.setContrast(Number(e.target.value) / 100)}
            className="w-full accent-neutral-800"
          />
          <span className="text-xs text-neutral-400 mt-1 block">{props.contrast.toFixed(2)}</span>
        </label>

        <label className="flex items-center gap-3 mb-6 cursor-pointer">
          <input
            type="checkbox"
            checked={props.invert}
            onChange={(e) => props.setInvert(e.target.checked)}
            className="accent-neutral-800"
          />
          <span className="text-xs text-neutral-500">Invert</span>
        </label>

        <label className="block mb-6">
          <span className="text-xs text-neutral-500 block mb-2">Custom characters</span>
          <input
            type="text"
            value={props.customChars}
            onChange={(e) => props.setCustomChars(e.target.value)}
            placeholder="Leave empty for preset"
            className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm text-neutral-700 focus:outline-none focus:border-neutral-400"
          />
        </label>
      </div>
    </>
  )
}
