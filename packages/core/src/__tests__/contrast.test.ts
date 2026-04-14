import { describe, it, expect } from 'vitest'
import { enhanceContrast } from '../contrast.js'
import type { ShapeVector } from '../types.js'

describe('enhanceContrast', () => {
  it('returns original vector when strength is 0', () => {
    const vec: ShapeVector = [0.2, 0.4, 0.6, 0.8, 0.3, 0.5]
    const result = enhanceContrast(vec, 0)
    expect(result).toEqual(vec)
  })

  it('pushes values away from mean', () => {
    const vec: ShapeVector = [0.3, 0.7, 0.3, 0.7, 0.3, 0.7]
    const result = enhanceContrast(vec, 0.5)
    expect(result[0]).toBeCloseTo(0.2, 5)
    expect(result[1]).toBeCloseTo(0.8, 5)
  })

  it('clamps to [0, 1]', () => {
    const vec: ShapeVector = [0.0, 1.0, 0.5, 0.5, 0.0, 1.0]
    const result = enhanceContrast(vec, 1.0)
    for (const v of result) {
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(1)
    }
  })
})
