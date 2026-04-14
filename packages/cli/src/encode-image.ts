import { createCanvas } from '@napi-rs/canvas'
import type { RenderResult } from '@novaglow/core'

export interface ImageEncodeOptions {
  fontSize?: number
  fontFamily?: string
  background?: string
  defaultColor?: string
  format?: 'png' | 'jpeg'
  quality?: number
}

export async function renderToImageBuffer(
  result: RenderResult,
  options: ImageEncodeOptions = {},
): Promise<Buffer> {
  const {
    fontSize = 14,
    fontFamily = '"Courier New", monospace',
    background = '#ffffff',
    defaultColor = '#000000',
    format = 'png',
    quality = 90,
  } = options

  const charW = fontSize * 0.6
  const charH = fontSize * 1.2
  const width = Math.ceil(result.cols * charW)
  const height = Math.ceil(result.rows * charH)

  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = background
  ctx.fillRect(0, 0, width, height)
  ctx.font = `${fontSize}px ${fontFamily}`
  ctx.textBaseline = 'top'

  for (const cell of result.cells) {
    if (cell.char === ' ') continue
    const x = cell.col * charW
    const y = cell.row * charH
    ctx.fillStyle = cell.color
      ? `rgb(${cell.color[0]},${cell.color[1]},${cell.color[2]})`
      : defaultColor
    ctx.fillText(cell.char, x, y)
  }

  if (format === 'jpeg') {
    return Buffer.from(canvas.toBuffer('image/jpeg', quality))
  }
  return Buffer.from(canvas.toBuffer('image/png'))
}
