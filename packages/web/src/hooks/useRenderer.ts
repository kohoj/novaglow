import { useState, useCallback, useRef, useEffect } from 'react'
import {
  precomputeShapeVectors,
  render,
  CHARSETS,
  PRESETS,
  type CharShape,
  type RenderResult,
  type ImageData as NovaImageData,
} from '@novaglow/core'

function createBrowserCharRenderer(fontSize: number, fontAspect: number) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  ctx.font = `${fontSize}px "Courier New", monospace`
  const metrics = ctx.measureText('M')
  const cellW = Math.ceil(metrics.width) + 4
  const cellH = Math.ceil(cellW * fontAspect)
  canvas.width = cellW
  canvas.height = cellH

  return {
    cellW,
    cellH,
    renderChar(char: string) {
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, cellW, cellH)
      ctx.fillStyle = '#fff'
      ctx.font = `${fontSize}px "Courier New", monospace`
      ctx.textBaseline = 'middle'
      ctx.textAlign = 'center'
      ctx.fillText(char, cellW / 2, cellH / 2)

      const imageData = ctx.getImageData(0, 0, cellW, cellH)
      const data = new Float32Array(cellW * cellH)
      for (let i = 0; i < data.length; i++) {
        data[i] = imageData.data[i * 4] / 255
      }
      return { data, width: cellW, height: cellH }
    },
  }
}

export function useRenderer() {
  const [result, setResult] = useState<RenderResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [presetName, setPresetName] = useState('classic')
  const [cols, setCols] = useState(80)
  const [contrast, setContrast] = useState(0.3)
  const [invert, setInvert] = useState(false)
  const [customChars, setCustomChars] = useState('')

  const charShapesRef = useRef<Map<string, CharShape[]>>(new Map())
  const imageDataRef = useRef<NovaImageData | null>(null)

  const getCharShapes = useCallback((charset: string, custom: string): CharShape[] => {
    const key = custom || charset
    if (!charShapesRef.current.has(key)) {
      const chars = custom
        ? [...custom]
        : CHARSETS[charset as keyof typeof CHARSETS] ?? CHARSETS.full
      const r = createBrowserCharRenderer(24, 2.0)
      charShapesRef.current.set(key, precomputeShapeVectors(chars, r.renderChar, r.cellW, r.cellH))
    }
    return charShapesRef.current.get(key)!
  }, [])

  const doRender = useCallback(
    (imageData: NovaImageData) => {
      setLoading(true)
      const preset = PRESETS[presetName]
      const charShapes = getCharShapes(preset?.charset ?? 'full', customChars)
      const result = render(imageData, {
        cols,
        contrast,
        invert,
        color: true,
        charShapes,
      })
      setResult(result)
      setLoading(false)
    },
    [presetName, cols, contrast, invert, customChars, getCharShapes],
  )

  // Re-render when params change
  useEffect(() => {
    if (imageDataRef.current) {
      doRender(imageDataRef.current)
    }
  }, [doRender])

  const loadFile = useCallback(
    async (file: File) => {
      const bitmap = await createImageBitmap(file)
      const canvas = document.createElement('canvas')
      canvas.width = bitmap.width
      canvas.height = bitmap.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(bitmap, 0, 0)
      const imgData = ctx.getImageData(0, 0, bitmap.width, bitmap.height)
      const novaData: NovaImageData = {
        data: imgData.data,
        width: bitmap.width,
        height: bitmap.height,
      }
      imageDataRef.current = novaData
      doRender(novaData)
    },
    [doRender],
  )

  return {
    result, loading, loadFile,
    presetName, setPresetName,
    cols, setCols,
    contrast, setContrast,
    invert, setInvert,
    customChars, setCustomChars,
  }
}
