import { memo } from 'react'
import { renderToSvg, renderToHtml, PRESETS, type RenderResult } from '@novaglow/core'
import type { AsciiCanvasHandle } from './AsciiCanvas'

interface Props {
  result: RenderResult
  preset: string
  canvasRef: React.RefObject<AsciiCanvasHandle | null>
}

function download(content: string | Blob, filename: string) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export const ExportBar = memo(function ExportBar({ result, preset, canvasRef }: Props) {
  const p = PRESETS[preset]
  const bg = p?.background ?? '#ffffff'
  const fg = p?.color ?? '#000000'

  const exportSvg = () => {
    const svg = renderToSvg(result, { background: bg, defaultColor: fg })
    download(svg, 'novaglow.svg')
  }

  const exportHtml = () => {
    const html = renderToHtml(result, { background: bg, defaultColor: fg })
    download(html, 'novaglow.html')
  }

  const exportPng = () => {
    const canvas = canvasRef.current?.getCanvas()
    if (!canvas) return
    canvas.toBlob((blob) => {
      if (blob) download(blob, 'novaglow.png')
    })
  }

  return (
    <div className="fixed bottom-16 left-1/2 -translate-x-1/2 flex gap-2">
      <button onClick={exportSvg} className="px-4 py-2 text-xs bg-neutral-900 text-white rounded-full hover:bg-neutral-700 transition-colors">
        SVG
      </button>
      <button onClick={exportPng} className="px-4 py-2 text-xs bg-neutral-900 text-white rounded-full hover:bg-neutral-700 transition-colors">
        PNG
      </button>
      <button onClick={exportHtml} className="px-4 py-2 text-xs bg-neutral-900 text-white rounded-full hover:bg-neutral-700 transition-colors">
        HTML
      </button>
    </div>
  )
})
