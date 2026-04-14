import { PRESETS } from '@novaglow/core'

interface Props {
  current: string
  onChange: (name: string) => void
  onNewFile?: (file: File) => void
}

export function PresetBar({ current, onChange }: Props) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-neutral-100 px-8 py-4">
      <div className="flex items-center justify-center gap-4">
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
}
