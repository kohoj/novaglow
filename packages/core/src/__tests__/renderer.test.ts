import { describe, it, expect } from 'vitest'
import { sampleCell, findBestCharacter, render } from '../renderer.js'
import type { ImageData, CharShape, ShapeVector } from '../types.js'

describe('sampleCell', () => {
  it('returns a 6D vector', () => {
    // White image with full alpha — darkness should be near 0
    const data = new Uint8ClampedArray(10 * 10 * 4)
    data.fill(255)
    const image: ImageData = { data, width: 10, height: 10 }
    const vec = sampleCell(image, 0, 0, 10, 10)
    expect(vec).toHaveLength(6)
    for (const v of vec) {
      expect(v).toBeLessThan(0.2)
    }
  })

  it('returns high values for dark image', () => {
    // Black image (R=0,G=0,B=0,A=255) — darkness should be near 1
    const data = new Uint8ClampedArray(10 * 10 * 4)
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 0; data[i + 1] = 0; data[i + 2] = 0; data[i + 3] = 255
    }
    const image: ImageData = { data, width: 10, height: 10 }
    const vec = sampleCell(image, 0, 0, 10, 10)
    expect(vec).toHaveLength(6)
    for (const v of vec) {
      expect(v).toBeGreaterThan(0.8)
    }
  })

  it('handles transparent pixels by compositing against white', () => {
    // Fully transparent image — should be treated as white (darkness ≈ 0)
    const data = new Uint8ClampedArray(10 * 10 * 4) // all zeros = transparent black
    const image: ImageData = { data, width: 10, height: 10 }
    const vec = sampleCell(image, 0, 0, 10, 10)
    for (const v of vec) {
      expect(v).toBeLessThan(0.1)
    }
  })
})

describe('findBestCharacter', () => {
  it('picks the character with closest shape vector', () => {
    const shapes: CharShape[] = [
      { char: 'A', vector: [1, 0, 0, 0, 0, 0] },
      { char: 'B', vector: [0, 1, 0, 0, 0, 0] },
      { char: 'C', vector: [0, 0, 1, 0, 0, 0] },
    ]
    const query: ShapeVector = [0.9, 0.1, 0.0, 0.0, 0.0, 0.0]
    expect(findBestCharacter(query, shapes)).toBe('A')
  })

  it('returns space for zero vector against space+at', () => {
    const shapes: CharShape[] = [
      { char: ' ', vector: [0, 0, 0, 0, 0, 0] },
      { char: '@', vector: [1, 1, 1, 1, 1, 1] },
    ]
    const query: ShapeVector = [0, 0, 0, 0, 0, 0]
    expect(findBestCharacter(query, shapes)).toBe(' ')
  })
})

describe('render', () => {
  const shapes: CharShape[] = [
    { char: ' ', vector: [0, 0, 0, 0, 0, 0] },
    { char: '@', vector: [1, 1, 1, 1, 1, 1] },
  ]

  it('returns correct grid dimensions', () => {
    const data = new Uint8ClampedArray(80 * 40 * 4)
    const image: ImageData = { data, width: 80, height: 40 }
    const result = render(image, { cols: 10, charShapes: shapes })
    expect(result.cols).toBe(10)
    expect(result.rows).toBeGreaterThan(0)
    expect(result.cells.length).toBe(result.rows * result.cols)
  })

  it('handles NaN cols gracefully', () => {
    const data = new Uint8ClampedArray(80 * 40 * 4)
    const image: ImageData = { data, width: 80, height: 40 }
    const result = render(image, { cols: NaN, charShapes: shapes })
    expect(result.rows).toBe(0)
    expect(result.cells).toHaveLength(0)
  })

  it('handles zero fontAspect gracefully', () => {
    const data = new Uint8ClampedArray(80 * 40 * 4)
    const image: ImageData = { data, width: 80, height: 40 }
    const result = render(image, { cols: 10, fontAspect: 0, charShapes: shapes })
    expect(result.rows).toBe(0)
    expect(result.cells).toHaveLength(0)
  })
})
