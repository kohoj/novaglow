import { useRef, useEffect, memo } from 'react'

interface Props {
  playing: boolean
  duration: number
  videoTimeRef: React.RefObject<number>
  onVideoTimeUpdateRef: React.MutableRefObject<((time: number) => void) | null>
  onTogglePlay: () => void
  onSeek: (time: number) => void
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export const VideoControls = memo(function VideoControls({
  playing, duration, videoTimeRef, onVideoTimeUpdateRef, onTogglePlay, onSeek,
}: Props) {
  const timeDisplayRef = useRef<HTMLSpanElement>(null)
  const sliderRef = useRef<HTMLInputElement>(null)

  // Register a callback that updates DOM directly — no React re-render per frame
  useEffect(() => {
    onVideoTimeUpdateRef.current = (time: number) => {
      if (timeDisplayRef.current) {
        timeDisplayRef.current.textContent = formatTime(time)
      }
      if (sliderRef.current && !sliderRef.current.matches(':active')) {
        sliderRef.current.value = String(time)
      }
    }
    return () => { onVideoTimeUpdateRef.current = null }
  }, [onVideoTimeUpdateRef])

  return (
    <div className="fixed bottom-36 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white/80 backdrop-blur-sm border border-neutral-200 rounded-full px-4 py-2">
      <button
        onClick={onTogglePlay}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-900 text-white hover:bg-neutral-700 transition-colors text-xs"
      >
        {playing ? '||' : '\u25B6'}
      </button>
      <span
        ref={timeDisplayRef}
        className="text-xs text-neutral-500 tabular-nums w-12 text-right"
      >
        {formatTime(videoTimeRef.current)}
      </span>
      <input
        ref={sliderRef}
        type="range"
        min={0}
        max={duration || 1}
        step={0.1}
        defaultValue={videoTimeRef.current}
        onChange={(e) => onSeek(Number(e.target.value))}
        className="w-48 accent-neutral-900"
      />
      <span className="text-xs text-neutral-500 tabular-nums w-12">
        {formatTime(duration)}
      </span>
    </div>
  )
})
