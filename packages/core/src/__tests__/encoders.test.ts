import { describe, it, expect } from 'vitest'
import { renderToSvg } from '../encoders/svg.js'
import { renderToHtml } from '../encoders/html.js'
import type { RenderResult } from '../types.js'

const mockResult: RenderResult = {
  cells: [
    { char: '@', row: 0, col: 0, color: [255, 0, 0] },
    { char: '.', row: 0, col: 1, color: [0, 255, 0] },
    { char: '#', row: 1, col: 0, color: null },
    { char: ' ', row: 1, col: 1, color: null },
  ],
  rows: 2,
  cols: 2,
  sourceWidth: 100,
  sourceHeight: 100,
}

describe('renderToSvg', () => {
  it('produces valid SVG with <text> elements', () => {
    const svg = renderToSvg(mockResult)
    expect(svg).toContain('<svg')
    expect(svg).toContain('</svg>')
    expect(svg).toContain('<text')
    expect(svg).toContain('@')
  })

  it('includes color when cells have color', () => {
    const svg = renderToSvg(mockResult)
    expect(svg).toContain('fill="rgb(255,0,0)"')
  })

  it('respects background option', () => {
    const svg = renderToSvg(mockResult, { background: '#000000' })
    expect(svg).toContain('#000000')
  })
})

describe('renderToHtml', () => {
  it('produces HTML with <pre> block', () => {
    const html = renderToHtml(mockResult)
    expect(html).toContain('<pre')
    expect(html).toContain('</pre>')
    expect(html).toContain('@')
  })

  it('wraps colored chars in <span>', () => {
    const html = renderToHtml(mockResult)
    expect(html).toContain('color:rgb(255,0,0)')
  })
})
