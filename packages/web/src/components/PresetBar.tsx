import { useCallback, memo } from 'react'
import { PRESETS } from '@novaglow/core'

interface Props {
  current: string
  onChange: (name: string) => void
  onNewFile: (file: File) => void
  onReset: () => void
}

export const PresetBar = memo(function PresetBar({ current, onChange, onNewFile, onReset }: Props) {
  const handleNewFile = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*,video/*'
    input.onchange = () => {
      const file = input.files?.[0]
      if (file) {
        // Reset first, then load the new file — avoids UI flash before selection
        onReset()
        onNewFile(file)
      }
    }
    input.click()
  }, [onNewFile, onReset])

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-neutral-100 px-8 py-4">
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={handleNewFile}
          className="px-4 py-2 text-xs tracking-wide rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 transition-all"
        >
          Change File
        </button>
        <div className="w-px h-5 bg-neutral-200" />
        {Object.entries(PRESETS).map(([name, preset]) => (
          <button
            key={name}
            onClick={() => onChange(name)}
            className={`
              px-4 py-2 text-xs tracking-wide rounded-full transition-all
              ${current === name
                ? 'bg-neutral-900 text-white'
                : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200'
              }
            `}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  )
})
