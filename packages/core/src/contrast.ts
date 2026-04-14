import type { ShapeVector } from './types.js'

export function enhanceContrast(vector: ShapeVector, strength: number): ShapeVector {
  if (strength <= 0) return vector

  const mean = vector.reduce((sum, v) => sum + v, 0) / vector.length

  return vector.map((v) => {
    const diff = v - mean
    const enhanced = mean + diff * (1.0 + strength)
    return Math.max(0, Math.min(1, enhanced))
  }) as ShapeVector
}
