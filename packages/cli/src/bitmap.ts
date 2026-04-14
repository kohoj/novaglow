import { createCanvas } from '@napi-rs/canvas'
import type { GrayscaleBitmap } from '@novaglow/core'

export function createCharRenderer(fontSize: number, fontAspect: number) {
  const canvas = createCanvas(1, 1)
  const ctx = canvas.getContext('2d')
  ctx.font = `${fontSize}px "Courier New", "DejaVu Sans Mono", monospace`
  const metrics = ctx.measureText('M')
  const cellW = Math.ceil(metrics.width) + 4
  const cellH = Math.ceil(cellW * fontAspect)

  return {
    cellW,
    cellH,
    renderChar(char: string): GrayscaleBitmap {
      const c = createCanvas(cellW, cellH)
      const cx = c.getContext('2d')
      cx.fillStyle = '#000'
      cx.fillRect(0, 0, cellW, cellH)
      cx.fillStyle = '#fff'
      cx.font = `${fontSize}px "Courier New", "DejaVu Sans Mono", monospace`
      cx.textBaseline = 'middle'
      cx.textAlign = 'center'
      cx.fillText(char, cellW / 2, cellH / 2)

      const imageData = cx.getImageData(0, 0, cellW, cellH)
      const data = new Float32Array(cellW * cellH)
      for (let i = 0; i < data.length; i++) {
        data[i] = imageData.data[i * 4] / 255
      }
      return { data, width: cellW, height: cellH }
    },
  }
}
