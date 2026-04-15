import { useCallback, useState } from 'react'

interface DropZoneProps {
  onFile: (file: File) => void
}

export function DropZone({ onFile }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file && (file.type.startsWith('image/') || file.type.startsWith('video/'))) {
        onFile(file)
      }
    },
    [onFile],
  )

  const handleClick = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*,video/*'
    input.onchange = () => {
      const file = input.files?.[0]
      if (file) onFile(file)
    }
    input.click()
  }, [onFile])

  return (
    <div
      onClick={handleClick}
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`
        flex flex-col items-center justify-center
        w-full max-w-lg mx-auto aspect-video
        border-2 border-dashed rounded-2xl cursor-pointer
        transition-all duration-200
        ${isDragging
          ? 'border-neutral-400 bg-neutral-50'
          : 'border-neutral-200 hover:border-neutral-300'
        }
      `}
    >
      <p className="text-neutral-400 text-sm tracking-wide">
        Drop image or video here
      </p>
      <p className="text-neutral-300 text-xs mt-2">
        or click to browse
      </p>
    </div>
  )
}
