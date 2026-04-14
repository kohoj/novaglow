import type { ImageData, CharShape, ShapeVector, CellResult, RenderResult, RenderOptions } from './types.js'
import { enhanceContrast } from './contrast.js'

function rgbToLightness(r: number, g: number, b: number): number {
  return 0.2126 * (r / 255) + 0.7152 * (g / 255) + 0.0722 * (b / 255)
}

const CIRCLE_TEMPLATE = [
  { cxFrac: 0.3, cyFrac: 0.28, rFrac: 0.35 },
  { cxFrac: 0.7, cyFrac: 0.22, rFrac: 0.35 },
  { cxFrac: 0.3, cyFrac: 0.53, rFrac: 0.35 },
  { cxFrac: 0.7, cyFrac: 0.47, rFrac: 0.35 },
  { cxFrac: 0.3, cyFrac: 0.78, rFrac: 0.35 },
  { cxFrac: 0.7, cyFrac: 0.72, rFrac: 0.35 },
]

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

    let totalLight = 0
    let count = 0
    const nSamples = 12

    for (let ai = 0; ai < nSamples; ai++) {
      const angle = (2 * Math.PI * ai) / nSamples
      for (const rMult of [0.0, 0.5, 1.0]) {
        const sx = Math.floor(cx + Math.cos(angle) * radius * rMult)
        const sy = Math.floor(cy + Math.sin(angle) * radius * rMult)
        if (sx >= 0 && sx < width && sy >= 0 && sy < height) {
          const idx = (sy * width + sx) * 4
          totalLight += rgbToLightness(data[idx], data[idx + 1], data[idx + 2])
          count++
        }
      }
    }

    vector.push(count > 0 ? totalLight / count : 0)
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

  const { data, width, height } = image
  const cellW = width / cols
  const cellH = cellW * fontAspect
  const rows = Math.floor(height / cellH)

  if (rows === 0 || cols === 0) {
    return { cells: [], rows: 0, cols: 0, sourceWidth: width, sourceHeight: height }
  }

  const cells: CellResult[] = []

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cx = col * cellW
      const cy = row * cellH

      let sv = sampleCell(image, cx, cy, cellW, cellH)

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
        let rSum = 0, gSum = 0, bSum = 0, count = 0
        for (let y = y0; y < y1; y++) {
          for (let x = x0; x < x1; x++) {
            const idx = (y * width + x) * 4
            rSum += data[idx]
            gSum += data[idx + 1]
            bSum += data[idx + 2]
            count++
          }
        }
        if (count > 0) {
          cellColor = [
            Math.round(rSum / count),
            Math.round(gSum / count),
            Math.round(bSum / count),
          ]
        }
      }

      cells.push({ char, row, col, color: cellColor })
    }
  }

  return { cells, rows, cols, sourceWidth: width, sourceHeight: height }
}
