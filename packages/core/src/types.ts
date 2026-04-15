/** 6D shape vector — one float per sampling circle */
export type ShapeVector = [number, number, number, number, number, number]

/** A character with its precomputed shape vector */
export interface CharShape {
  char: string
  vector: ShapeVector
}

/** Result for a single grid cell */
export interface CellResult {
  char: string
  row: number
  col: number
  /** Average RGB color of the source region, null if grayscale */
  color: [number, number, number] | null
}

/** Full render result */
export interface RenderResult {
  cells: CellResult[]
  rows: number
  cols: number
  sourceWidth: number
  sourceHeight: number
}

/** Pixel data passed into the renderer — flat RGBA array */
export interface ImageData {
  data: Uint8ClampedArray
  width: number
  height: number
}

/** Grayscale bitmap for shape vector computation */
export interface GrayscaleBitmap {
  data: Float32Array
  width: number
  height: number
}

export interface RenderOptions {
  cols?: number
  fontAspect?: number
  contrast?: number
  invert?: boolean
  color?: boolean
  charShapes?: CharShape[]
}

export interface Preset {
  name: string
  label: string
  charset: string
  color: string
  background: string
  contrast: number
  density: number
  /** Dark-background preset: invert so bright source → dense char */
  invert?: boolean
}
