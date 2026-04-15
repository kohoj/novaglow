import { describe, it, expect } from 'vitest'
import {
  makeSamplingCircles,
  sampleCircleOverlap,
  computeShapeVector,
  normalizeVectors,
} from '../shape-vectors.js'
import type { GrayscaleBitmap } from '../types.js'

describe('makeSamplingCircles', () => {
  it('returns 6 circles', () => {
    const circles = makeSamplingCircles(20, 40)
    expect(circles).toHaveLength(6)
  })

  it('circles are within cell bounds', () => {
    const w = 20, h = 40
    const circles = makeSamplingCircles(w, h)
    for (const { cx, cy, radius } of circles) {
      expect(cx).toBeGreaterThan(0)
      expect(cx).toBeLessThan(w)
      expect(cy).toBeGreaterThan(0)
      expect(cy).toBeLessThan(h)
      expect(radius).toBeGreaterThan(0)
    }
  })
})

describe('sampleCircleOverlap', () => {
  it('returns 0 for blank bitmap', () => {
    const bitmap: GrayscaleBitmap = {
      data: new Float32Array(100),
      width: 10,
      height: 10,
    }
    const result = sampleCircleOverlap(bitmap, 5, 5, 3)
    expect(result).toBe(0)
  })

  it('returns 1 for fully lit bitmap', () => {
    const data = new Float32Array(100)
    data.fill(1.0)
    const bitmap: GrayscaleBitmap = { data, width: 10, height: 10 }
    const result = sampleCircleOverlap(bitmap, 5, 5, 3)
    expect(result).toBeCloseTo(1.0, 1)
  })
})

describe('computeShapeVector', () => {
  it('returns a 6D vector', () => {
    const data = new Float32Array(400)
    data.fill(0.5)
    const bitmap: GrayscaleBitmap = { data, width: 20, height: 20 }
    const circles = makeSamplingCircles(20, 20)
    const vec = computeShapeVector(bitmap, circles)
    expect(vec).toHaveLength(6)
  })
})

describe('normalizeVectors', () => {
  it('normalizes per dimension to [0, 1] in relative mode', () => {
    const vectors: [number, number, number, number, number, number][] = [
      [0.2, 0.4, 0.6, 0.8, 1.0, 0.0],
      [0.4, 0.8, 0.3, 0.4, 0.5, 0.0],
    ]
    const result = normalizeVectors(vectors, false)
    expect(result[0][0]).toBeCloseTo(0.5, 5)
    expect(result[1][0]).toBeCloseTo(1.0, 5)
    expect(result[0][5]).toBe(0)
    expect(result[1][5]).toBe(0)
  })

  it('returns vectors unchanged in absolute scale mode', () => {
    const vectors: [number, number, number, number, number, number][] = [
      [0.2, 0.4, 0.6, 0.8, 1.0, 0.0],
      [0.4, 0.8, 0.3, 0.4, 0.5, 0.0],
    ]
    const result = normalizeVectors(vectors, true)
    expect(result).toEqual(vectors)
  })
})
