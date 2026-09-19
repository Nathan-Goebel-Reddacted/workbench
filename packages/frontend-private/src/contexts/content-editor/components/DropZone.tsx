import type { CSSProperties, DragEvent, ReactNode } from 'react'
import { useRef, useState } from 'react'
import { useUpload } from '../../../shared/hooks/useUpload'

type Props = {
  mimePrefixes: string[]
  extensions: string[]
  hint: string
  onUploaded: (url: string, filename: string) => void
  children?: ReactNode
}

function accepts(file: File, mimePrefixes: string[], extensions: string[]): boolean {
  if (mimePrefixes.some(prefix => file.type.startsWith(prefix))) return true
  const dotIndex = file.name.lastIndexOf('.')
  if (dotIndex === -1) return false
  return extensions.includes(file.name.slice(dotIndex + 1).toLowerCase())
}

export function DropZone({ mimePrefixes, extensions, hint, onUploaded, children }: Props) {
  const [over, setOver] = useState(false)
  const { uploading, error, upload, reject } = useUpload()
  const depth = useRef(0)

  const reset = () => {
    depth.current = 0
    setOver(false)
  }

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    depth.current += 1
    setOver(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    depth.current -= 1
    if (depth.current <= 0) reset()
  }

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    reset()

    const file = e.dataTransfer.files?.[0]
    if (!file) return
    if (!accepts(file, mimePrefixes, extensions)) {
      reject('This file type is not accepted here.')
      return
    }

    const url = await upload(file)
    if (url) onUploaded(url, file.name)
  }

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={e => e.preventDefault()}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={over ? { ...zoneStyle, ...zoneOverStyle } : zoneStyle}
    >
      {children}
      <span style={hintStyle}>{uploading ? 'Uploading…' : over ? 'Release to upload' : hint}</span>
      {error && <span style={errorStyle}>{error}</span>}
    </div>
  )
}

const zoneStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  padding: '0.75rem',
  borderRadius: '8px',
  border: '1px dashed var(--color-border)',
  backgroundColor: 'transparent',
  transition: 'border-color 120ms ease, background-color 120ms ease',
}
const zoneOverStyle: CSSProperties = {
  borderColor: 'var(--color-primary)',
  backgroundColor: 'var(--color-bg)',
}
const hintStyle: CSSProperties = { fontSize: '0.6875rem', color: 'var(--color-text-muted)' }
const errorStyle: CSSProperties = { fontSize: '0.6875rem', color: 'var(--color-primary)' }
