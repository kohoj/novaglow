import { useRef } from 'react'
import { DropZone } from './components/DropZone'
import { useRenderer } from './hooks/useRenderer'
import { AsciiCanvas, type AsciiCanvasHandle } from './components/AsciiCanvas'
import { PresetBar } from './components/PresetBar'
import { ParamPanel } from './components/ParamPanel'
import { ExportBar } from './components/ExportBar'
import { VideoControls } from './components/VideoControls'

export default function App() {
  const renderer = useRenderer()
  const canvasRef = useRef<AsciiCanvasHandle>(null)

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="px-8 py-6">
        <h1 className="text-sm font-medium tracking-widest text-neutral-800 uppercase">
          novaglow
        </h1>
      </header>

      <main className="flex-1 flex items-center justify-center px-8 pb-24">
        {renderer.result ? (
          <AsciiCanvas ref={canvasRef} result={renderer.result} preset={renderer.presetName} />
        ) : (
          <DropZone onFile={renderer.loadFile} />
        )}
      </main>

      {renderer.result && (
        <>
          {renderer.isVideo && (
            <VideoControls
              playing={renderer.playing}
              duration={renderer.videoDuration}
              videoTimeRef={renderer.videoTimeRef}
              onVideoTimeUpdateRef={renderer.onVideoTimeUpdateRef}
              onTogglePlay={renderer.togglePlay}
              onSeek={renderer.seekVideo}
            />
          )}
          <ParamPanel
            cols={renderer.cols}
            setCols={renderer.setCols}
            contrast={renderer.contrast}
            setContrast={renderer.setContrast}
            invert={renderer.invert}
            setInvert={renderer.setInvert}
            customChars={renderer.customChars}
            setCustomChars={renderer.setCustomChars}
          />
          <ExportBar result={renderer.result} preset={renderer.presetName} canvasRef={canvasRef} />
          <PresetBar
            current={renderer.presetName}
            onChange={renderer.setPresetName}
            onNewFile={renderer.loadFile}
            onReset={renderer.reset}
          />
        </>
      )}
    </div>
  )
}
