import type { ImageData, CharShape, ShapeVector, CellResult, RenderResult, RenderOptions } from './types.js'
import { enhanceContrast } from './contrast.js'

/** Convert RGB (0–255) to relative luminance (0–1) */
function rgbToLightness(r: number, g: number, b: number): number {
  return 0.2126 * (r / 255) + 0.7152 * (g / 255) + 0.0722 * (b / 255)
}

/**
 * Sampling circle template — fractional positions within a cell.
 * Uses the same stagger layout as makeSamplingCircles: 3×2 grid, ±0.03 stagger.
 */
const STAGGER = 0.03
const CIRCLE_TEMPLATE = [
  { cxFrac: 0.3, cyFrac: 0.25 + STAGGER, rFrac: 0.35 },  // top-left
  { cxFrac: 0.7, cyFrac: 0.25 - STAGGER, rFrac: 0.35 },  // top-right
  { cxFrac: 0.3, cyFrac: 0.50 + STAGGER, rFrac: 0.35 },  // mid-left
  { cxFrac: 0.7, cyFrac: 0.50 - STAGGER, rFrac: 0.35 },  // mid-right
  { cxFrac: 0.3, cyFrac: 0.75 + STAGGER, rFrac: 0.35 },  // bot-left
  { cxFrac: 0.7, cyFrac: 0.75 - STAGGER, rFrac: 0.35 },  // bot-right
]

/**
 * Sample a cell from the source image using full-area circle overlap.
 * This matches the sampling method used in precomputeShapeVectors
 * (sampleCircleOverlap) for consistent matching.
 */
export function sampleCell(
  image: ImageData,
  cellX: number,
  cellY: number,
  cellW: number,
  cellH: number,
): ShapeVector {
  const { data, width, height } = image
  const vector: number[] = []

  for (const { cxFrac, cyFrac, rFrac } of CIRCLE_TEMPLATE) {
    const cx = cellX + cxFrac * cellW
    const cy = cellY + cyFrac * cellH
    const radius = rFrac * cellW
    const r2 = radius * radius

    const yMin = Math.max(0, Math.floor(cy - radius))
    const yMax = Math.min(height, Math.ceil(cy + radius) + 1)
    const xMin = Math.max(0, Math.floor(cx - radius))
    const xMax = Math.min(width, Math.ceil(cx + radius) + 1)

    let totalDarkness = 0
    let count = 0

    for (let y = yMin; y < yMax; y++) {
      for (let x = xMin; x < xMax; x++) {
        if ((x - cx) ** 2 + (y - cy) ** 2 <= r2) {
          const idx = (y * width + x) * 4
          const alpha = data[idx + 3] / 255
          const lightness = rgbToLightness(data[idx], data[idx + 1], data[idx + 2])
          // Measure darkness (ink), not lightness, so dark source → dense char.
          // Composite against white for transparent pixels.
          totalDarkness += (1.0 - lightness) * alpha
          count++
        }
      }
    }

    vector.push(count > 0 ? totalDarkness / count : 0)
  }

  return vector as ShapeVector
}

export function findBestCharacter(samplingVector: ShapeVector, charShapes: CharShape[]): string {
  let bestChar = ' '
  let bestDist = Infinity

  for (const { char, vector } of charShapes) {
    let dist = 0
    for (let i = 0; i < 6; i++) {
      dist += (samplingVector[i] - vector[i]) ** 2
    }
    if (dist < bestDist) {
      bestDist = dist
      bestChar = char
    }
  }

  return bestChar
}

export function render(image: ImageData, options: RenderOptions = {}): RenderResult {
  const {
    cols = 80,
    fontAspect = 2.0,
    contrast = 0.3,
    invert = false,
    color = false,
    charShapes,
  } = options

  if (!charShapes || charShapes.length === 0) {
    throw new Error('charShapes is required — precompute with precomputeShapeVectors()')
  }

  const safeCols = Math.max(1, Math.floor(cols))
  if (!Number.isFinite(safeCols) || !Number.isFinite(fontAspect) || fontAspect <= 0) {
    return { cells: [], rows: 0, cols: 0, sourceWidth: image.width, sourceHeight: image.height }
  }

  const { data, width, height } = image
  const cellW = width / safeCols
  const cellH = cellW * fontAspect
  const rows = Math.floor(height / cellH)

  if (rows === 0 || safeCols === 0 || !Number.isFinite(rows)) {
    return { cells: [], rows: 0, cols: 0, sourceWidth: width, sourceHeight: height }
  }

  const cells: CellResult[] = []

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < safeCols; col++) {
      const cx = col * cellW
      const cy = row * cellH

      let sv = sampleCell(image, cx, cy, cellW, cellH)

      // sampleCell now measures darkness (ink density).
      // invert=true flips it: for dark-background presets where
      // bright source areas should produce dense characters.
      if (invert) {
        sv = sv.map((v) => 1.0 - v) as ShapeVector
      }

      sv = enhanceContrast(sv, contrast)

      const char = findBestCharacter(sv, charShapes)

      let cellColor: [number, number, number] | null = null
      if (color) {
        const x0 = Math.floor(cx)
        const x1 = Math.min(Math.floor(cx + cellW), width)
        const y0 = Math.floor(cy)
        const y1 = Math.min(Math.floor(cy + cellH), height)
        let rSum = 0, gSum = 0, bSum = 0, pxCount = 0
        for (let y = y0; y < y1; y++) {
          for (let x = x0; x < x1; x++) {
            const idx = (y * width + x) * 4
            rSum += data[idx]
            gSum += data[idx + 1]
            bSum += data[idx + 2]
            pxCount++
          }
        }
        if (pxCount > 0) {
          cellColor = [
            Math.round(rSum / pxCount),
            Math.round(gSum / pxCount),
            Math.round(bSum / pxCount),
          ]
        }
      }

      cells.push({ char, row, col, color: cellColor })
    }
  }

  return { cells, rows, cols: safeCols, sourceWidth: width, sourceHeight: height }
}
