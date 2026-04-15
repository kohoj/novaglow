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
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Failed to get 2d context')
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
  const [presetName, setPresetName] = useState('classic')
  const [cols, setCols] = useState(80)
  const [contrast, setContrast] = useState(0.3)
  const [invert, setInvert] = useState(false)
  const [customChars, setCustomChars] = useState('')

  // Video state — only `isVideo`, `playing`, `videoDuration` drive React re-renders.
  // `videoTime` is updated via ref + callback to avoid 60fps re-render storms.
  const [isVideo, setIsVideo] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [videoDuration, setVideoDuration] = useState(0)
  const videoTimeRef = useRef(0)
  const onVideoTimeUpdateRef = useRef<((time: number) => void) | null>(null)

  const charShapesRef = useRef<Map<string, CharShape[]>>(new Map())
  const imageDataRef = useRef<NovaImageData | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const videoUrlRef = useRef<string | null>(null)
  const scratchCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const scratchCtxRef = useRef<CanvasRenderingContext2D | null>(null)
  const rafIdRef = useRef<number>(0)

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

  // Stable ref for render params so the video loop reads current values without re-subscribing
  const renderParamsRef = useRef({ presetName, cols, contrast, invert, customChars })
  renderParamsRef.current = { presetName, cols, contrast, invert, customChars }

  const doRender = useCallback(
    (imageData: NovaImageData) => {
      const { presetName: pn, cols: c, contrast: ct, invert: inv, customChars: cc } = renderParamsRef.current
      const preset = PRESETS[pn]
      const charShapes = getCharShapes(preset?.charset ?? 'full', cc)
      const effectiveInvert = inv || (preset?.invert ?? false)
      const res = render(imageData, {
        cols: c,
        contrast: ct,
        invert: effectiveInvert,
        color: true,
        charShapes,
      })
      setResult(res)
    },
    [getCharShapes],
  )

  // Re-render static image when params change
  useEffect(() => {
    if (imageDataRef.current && !isVideo) {
      doRender(imageDataRef.current)
    }
  }, [presetName, cols, contrast, invert, customChars, doRender, isVideo])

  const extractFrame = useCallback(() => {
    const video = videoRef.current
    const ctx = scratchCtxRef.current
    if (!video || !ctx) return
    ctx.drawImage(video, 0, 0)
    const imgData = ctx.getImageData(0, 0, video.videoWidth, video.videoHeight)
    doRender({ data: imgData.data, width: video.videoWidth, height: video.videoHeight })
  }, [doRender])

  // Video playback loop — updates time via ref callback, not setState
  const videoLoop = useCallback(() => {
    const video = videoRef.current
    if (!video || video.paused || video.ended) {
      // Render the final frame before stopping
      if (video && video.ended) {
        extractFrame()
      }
      setPlaying(false)
      return
    }
    videoTimeRef.current = video.currentTime
    onVideoTimeUpdateRef.current?.(video.currentTime)
    extractFrame()
    rafIdRef.current = requestAnimationFrame(videoLoop)
  }, [extractFrame])

  // Re-render current video frame when params change while paused
  useEffect(() => {
    if (isVideo && !playing && videoRef.current) {
      extractFrame()
    }
  }, [presetName, cols, contrast, invert, customChars, isVideo, playing, extractFrame])

  const stopVideoLoop = useCallback(() => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = 0
    }
  }, [])

  const cleanupVideo = useCallback(() => {
    stopVideoLoop()
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.removeAttribute('src')
      videoRef.current.load()
      videoRef.current = null
    }
    if (videoUrlRef.current) {
      URL.revokeObjectURL(videoUrlRef.current)
      videoUrlRef.current = null
    }
    scratchCanvasRef.current = null
    scratchCtxRef.current = null
  }, [stopVideoLoop])

  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    stopVideoLoop() // Always cancel any existing rAF loop first
    if (video.paused || video.ended) {
      if (video.ended) video.currentTime = 0
      video.play()
      setPlaying(true)
      rafIdRef.current = requestAnimationFrame(videoLoop)
    } else {
      video.pause()
      setPlaying(false)
    }
  }, [videoLoop, stopVideoLoop])

  const seekVideo = useCallback((time: number) => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = time
    videoTimeRef.current = time
    onVideoTimeUpdateRef.current?.(time)
    if (video.paused) {
      const onSeeked = () => {
        extractFrame()
        video.removeEventListener('seeked', onSeeked)
      }
      video.addEventListener('seeked', onSeeked)
    }
  }, [extractFrame])

  const loadFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        return
      }

      cleanupVideo()
      imageDataRef.current = null

      try {
        if (file.type.startsWith('video/')) {
          const video = document.createElement('video')
          video.muted = true
          video.playsInline = true
          video.preload = 'auto'
          const url = URL.createObjectURL(file)
          video.src = url
          videoUrlRef.current = url

          await new Promise<void>((resolve, reject) => {
            video.onloadeddata = () => resolve()
            video.onerror = () => reject(new Error('Failed to load video'))
          })

          videoRef.current = video
          const scratch = document.createElement('canvas')
          scratch.width = video.videoWidth
          scratch.height = video.videoHeight
          scratchCanvasRef.current = scratch
          scratchCtxRef.current = scratch.getContext('2d')

          setIsVideo(true)
          setPlaying(false)
          videoTimeRef.current = 0
          onVideoTimeUpdateRef.current?.(0)
          setVideoDuration(video.duration)

          // Render first frame
          extractFrame()

          // Auto-play
          video.play()
          setPlaying(true)
          rafIdRef.current = requestAnimationFrame(videoLoop)
          return
        }

        // Image path
        const bitmap = await createImageBitmap(file)
        const canvas = document.createElement('canvas')
        canvas.width = bitmap.width
        canvas.height = bitmap.height
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.drawImage(bitmap, 0, 0)
        const imgData = ctx.getImageData(0, 0, bitmap.width, bitmap.height)
        const novaData: NovaImageData = {
          data: imgData.data,
          width: bitmap.width,
          height: bitmap.height,
        }
        imageDataRef.current = novaData
        setIsVideo(false)
        setPlaying(false)
        doRender(novaData)
      } catch (e) {
        console.error('Failed to load file:', e)
      }
    },
    [doRender, cleanupVideo, extractFrame, videoLoop],
  )

  const reset = useCallback(() => {
    cleanupVideo()
    setResult(null)
    setIsVideo(false)
    setPlaying(false)
    videoTimeRef.current = 0
    setVideoDuration(0)
    imageDataRef.current = null
  }, [cleanupVideo])

  const applyPreset = useCallback((name: string) => {
    setPresetName(name)
    const p = PRESETS[name]
    if (p) {
      setContrast(p.contrast)
      setInvert(p.invert ?? false)
      setCustomChars('')
      if (p.density) setCols(Math.round(80 * (8 / p.density)))
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanupVideo()
  }, [cleanupVideo])

  return {
    result, loadFile, reset,
    presetName, setPresetName: applyPreset,
    cols, setCols,
    contrast, setContrast,
    invert, setInvert,
    customChars, setCustomChars,
    // Video controls
    isVideo, playing, togglePlay,
    videoTimeRef, onVideoTimeUpdateRef,
    videoDuration, seekVideo,
  }
}
