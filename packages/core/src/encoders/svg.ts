import type { RenderResult } from '../types.js'

export interface SvgOptions {
  fontSize?: number
  fontFamily?: string
  background?: string
  defaultColor?: string
}

export function renderToSvg(result: RenderResult, options: SvgOptions = {}): string {
  const {
    fontSize = 14,
    fontFamily = "'Courier New', Courier, monospace",
    background = '#ffffff',
    defaultColor = '#000000',
  } = options

  const charW = fontSize * 0.6
  const charH = fontSize * 1.2
  const width = result.cols * charW
  const height = result.rows * charH

  const lines: string[] = []
  lines.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`)
  lines.push(`<rect width="100%" height="100%" fill="${background}"/>`)
  lines.push(`<g font-family="${fontFamily}" font-size="${fontSize}">`)

  for (const cell of result.cells) {
    if (cell.char === ' ') continue
    const x = cell.col * charW
    const y = cell.row * charH + fontSize
    const fill = cell.color
      ? `rgb(${cell.color[0]},${cell.color[1]},${cell.color[2]})`
      : defaultColor
    const escaped = cell.char === '&' ? '&amp;'
      : cell.char === '<' ? '&lt;'
      : cell.char === '>' ? '&gt;'
      : cell.char === '"' ? '&quot;'
      : cell.char
    lines.push(`<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" fill="${fill}">${escaped}</text>`)
  }

  lines.push('</g>')
  lines.push('</svg>')

  return lines.join('\n')
}
