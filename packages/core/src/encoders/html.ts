import type { RenderResult } from '../types.js'

export interface HtmlOptions {
  fontSize?: number
  fontFamily?: string
  background?: string
  defaultColor?: string
  fullDocument?: boolean
}

export function renderToHtml(result: RenderResult, options: HtmlOptions = {}): string {
  const {
    fontSize = 14,
    fontFamily = "'Courier New', Courier, monospace",
    background = '#ffffff',
    defaultColor = '#000000',
    fullDocument = true,
  } = options

  const lines: string[] = []

  for (let row = 0; row < result.rows; row++) {
    const rowChars: string[] = []
    for (let col = 0; col < result.cols; col++) {
      const cell = result.cells[row * result.cols + col]
      const escaped = cell.char === '&' ? '&amp;'
        : cell.char === '<' ? '&lt;'
        : cell.char === '>' ? '&gt;'
        : cell.char
      if (cell.color) {
        rowChars.push(`<span style="color:rgb(${cell.color[0]},${cell.color[1]},${cell.color[2]})">${escaped}</span>`)
      } else {
        rowChars.push(escaped)
      }
    }
    lines.push(rowChars.join(''))
  }

  const preContent = lines.join('\n')
  const preStyle = `font-family:${fontFamily};font-size:${fontSize}px;line-height:1.2;letter-spacing:0;background:${background};color:${defaultColor};padding:16px;margin:0;`

  if (!fullDocument) {
    return `<pre style="${preStyle}">${preContent}</pre>`
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>novaglow</title>
<style>body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:${background}}</style>
</head>
<body>
<pre style="${preStyle}">${preContent}</pre>
</body>
</html>`
}
