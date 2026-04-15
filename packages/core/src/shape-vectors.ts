import type { GrayscaleBitmap, ShapeVector, CharShape } from './types.js'

export interface SamplingCircle {
  cx: number
  cy: number
  radius: number
}

export function makeSamplingCircles(cellW: number, cellH: number): SamplingCircle[] {
  const colCenters = [cellW * 0.3, cellW * 0.7]
  const rowCenters = [cellH * 0.25, cellH * 0.5, cellH * 0.75]
  const stagger = cellH * 0.03
  const radius = cellW * 0.35

  const circles: SamplingCircle[] = []
  for (let row = 0; row < 3; row++) {
    circles.push({ cx: colCenters[0], cy: rowCenters[row] + stagger, radius })
    circles.push({ cx: colCenters[1], cy: rowCenters[row] - stagger, radius })
  }
  return circles
}

export function sampleCircleOverlap(
  bitmap: GrayscaleBitmap,
  cx: number,
  cy: number,
  radius: number,
): number {
  const { data, width, height } = bitmap
  const r2 = radius * radius
  const yMin = Math.max(0, Math.floor(cy - radius))
  const yMax = Math.min(height, Math.ceil(cy + radius) + 1)
  const xMin = Math.max(0, Math.floor(cx - radius))
  const xMax = Math.min(width, Math.ceil(cx + radius) + 1)

  let total = 0
  let ink = 0
  for (let y = yMin; y < yMax; y++) {
    for (let x = xMin; x < xMax; x++) {
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r2) {
        total++
        // data stores brightness (white=1, black=0); convert to ink density
        // so dense character strokes produce high values, matching renderer's
        // darkness measurement.
        ink += 1.0 - data[y * width + x]
      }
    }
  }
  return total > 0 ? ink / total : 0
}

export function computeShapeVector(
  bitmap: GrayscaleBitmap,
  circles: SamplingCircle[],
): ShapeVector {
  return circles.map((c) =>
    sampleCircleOverlap(bitmap, c.cx, c.cy, c.radius),
  ) as ShapeVector
}

/**
 * Normalize vectors per dimension so max = 1.0.
 * When useAbsoluteScale is true, use a fixed max of 1.0 per dimension
 * instead of the per-charset max. This preserves the absolute luminance
 * scale so that changing charsets doesn't change what "1.0" means.
 */
export function normalizeVectors(vectors: ShapeVector[], useAbsoluteScale = false): ShapeVector[] {
  if (vectors.length === 0) return []

  if (useAbsoluteScale) {
    // Raw overlap values are already in [0, 1] — no normalization needed.
    // This ensures the same image vector matches consistently across charsets.
    return vectors
  }

  const maxPerDim: number[] = [0, 0, 0, 0, 0, 0]
  for (const vec of vectors) {
    for (let d = 0; d < 6; d++) {
      if (vec[d] > maxPerDim[d]) maxPerDim[d] = vec[d]
    }
  }

  return vectors.map((vec) =>
    vec.map((v, d) => (maxPerDim[d] > 0 ? v / maxPerDim[d] : 0)) as ShapeVector,
  )
}

/**
 * Precompute shape vectors for a charset.
 * Uses absolute scale (no per-charset normalization) so that
 * image sampling vectors match consistently regardless of charset size.
 */
export function precomputeShapeVectors(
  chars: string[],
  renderCharBitmap: (char: string) => GrayscaleBitmap,
  cellW: number,
  cellH: number,
): CharShape[] {
  const circles = makeSamplingCircles(cellW, cellH)

  const rawVectors: ShapeVector[] = []
  const validChars: string[] = []

  for (const char of chars) {
    const bitmap = renderCharBitmap(char)
    rawVectors.push(computeShapeVector(bitmap, circles))
    validChars.push(char)
  }

  const normalized = normalizeVectors(rawVectors, true)

  return validChars.map((char, i) => ({ char, vector: normalized[i] }))
}
