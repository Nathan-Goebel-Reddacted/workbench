import type { CSSProperties } from 'react'
import { useRef } from 'react'
import type { ButtonVariant } from '@atelier/shared-ui'
import { useUpload } from '../hooks/useUpload'

type Props = {
  accept?: string
  label?: string
  variant?: ButtonVariant
  disabled?: boolean
  onUploaded: (url: string, filename: string) => void
}

export function FileUpload({ accept, label = 'Upload', variant = 'secondary', disabled = false, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { uploading, error, upload } = useUpload()

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = await upload(file)
    if (inputRef.current) inputRef.current.value = ''
    if (url) onUploaded(url, file.name)
  }

  return (
    <div style={wrapperStyle}>
      <input ref={inputRef} type="file" accept={accept} onChange={handleChange} style={{ display: 'none' }} />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading || disabled}
        style={{ ...btnStyle, ...variantStyles[variant], ...(uploading || disabled ? disabledStyle : undefined) }}
        type="button"
      >
        {uploading ? '…' : label}
      </button>
      {error && <span style={errorStyle}>{error}</span>}
    </div>
  )
}

const wrapperStyle: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }

const btnStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  padding: '0.5rem 1rem',
  borderRadius: '6px',
  fontSize: '0.875rem',
  fontWeight: 500,
  cursor: 'pointer',
  border: '1px solid transparent',
  lineHeight: 1,
  whiteSpace: 'nowrap',
}

const disabledStyle: CSSProperties = { opacity: 0.4, cursor: 'not-allowed' }

const variantStyles: Record<string, CSSProperties> = {
  primary: {
    backgroundColor: 'var(--color-primary)',
    color: 'var(--color-on-primary)',
    borderColor: 'var(--color-primary)',
  },
  secondary: {
    backgroundColor: 'transparent',
    color: 'var(--color-primary)',
    borderColor: 'var(--color-primary)',
  },
  ghost: {
    backgroundColor: 'transparent',
    color: 'var(--color-text-muted)',
    borderColor: 'transparent',
  },
}

const errorStyle: CSSProperties = { fontSize: '0.75rem', color: 'var(--color-primary)' }
