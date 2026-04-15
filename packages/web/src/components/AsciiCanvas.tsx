import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react'
import type { RenderResult } from '@novaglow/core'
import { PRESETS } from '@novaglow/core'

interface Props {
  result: RenderResult
  preset: string
}

export interface AsciiCanvasHandle {
  getCanvas: () => HTMLCanvasElement | null
}

export const AsciiCanvas = forwardRef<AsciiCanvasHandle, Props>(
  function AsciiCanvas({ result, preset }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const p = PRESETS[preset]
    const fontSize = 14
    const charW = fontSize * 0.6
    const charH = fontSize * 1.2

    useImperativeHandle(ref, () => ({
      getCanvas: () => canvasRef.current,
    }), [])

    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const width = result.cols * charW
      const height = result.rows * charH
      canvas.width = width
      canvas.height = height

      ctx.fillStyle = p?.background ?? '#ffffff'
      ctx.fillRect(0, 0, width, height)
      ctx.font = `${fontSize}px "Courier New", monospace`
      ctx.textBaseline = 'top'

      for (const cell of result.cells) {
        if (cell.char === ' ') continue
        ctx.fillStyle = cell.color
          ? `rgb(${cell.color[0]},${cell.color[1]},${cell.color[2]})`
          : p?.color ?? '#000000'
        ctx.fillText(cell.char, cell.col * charW, cell.row * charH)
      }
    }, [result, preset, p, charW, charH])

    return (
      <canvas
        ref={canvasRef}
        className="max-w-full max-h-[70vh] object-contain"
      />
    )
  },
)
