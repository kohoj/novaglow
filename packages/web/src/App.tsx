import { DropZone } from './components/DropZone'
import { useRenderer } from './hooks/useRenderer'
import { AsciiCanvas } from './components/AsciiCanvas'
import { PresetBar } from './components/PresetBar'
import { ParamPanel } from './components/ParamPanel'
import { ExportBar } from './components/ExportBar'

export default function App() {
  const renderer = useRenderer()

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="px-8 py-6">
        <h1 className="text-sm font-medium tracking-widest text-neutral-800 uppercase">
          novaglow
        </h1>
      </header>

      <main className="flex-1 flex items-center justify-center px-8 pb-24">
        {renderer.result ? (
          <AsciiCanvas result={renderer.result} preset={renderer.presetName} />
        ) : (
          <DropZone onFile={renderer.loadFile} />
        )}
      </main>

      {renderer.result && (
        <>
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
          <ExportBar result={renderer.result} preset={renderer.presetName} />
          <PresetBar
            current={renderer.presetName}
            onChange={renderer.setPresetName}
            onNewFile={renderer.loadFile}
          />
        </>
      )}
    </div>
  )
}
