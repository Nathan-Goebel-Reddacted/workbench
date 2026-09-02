import type { CSSProperties, DragEvent, ReactNode } from 'react'
import { useRef, useState } from 'react'

type Props = {
  apiUrl: string
  // Préfixes MIME attendus, ex. ['image/'] ou ['image/', 'video/'] pour le carrousel.
  mimePrefixes: string[]
  // Extensions acceptées en secours : au drop, file.type est souvent vide
  // pour les conteneurs exotiques (mkv, avi…).
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

// Zone de dépôt : accepte un fichier glissé depuis l'ordinateur, l'envoie sur
// POST /uploads et remonte l'URL absolue — même contrat que FileUpload.
export function DropZone({ apiUrl, mimePrefixes, extensions, hint, onUploaded, children }: Props) {
  const [over, setOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // dragenter/dragleave se déclenchent aussi sur les enfants : on compte les entrées
  // pour ne retirer le surlignage qu'en sortant réellement de la zone.
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
      setError('Ce type de fichier n’est pas accepté ici.')
      return
    }

    setUploading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`${apiUrl}/uploads`, { method: 'POST', credentials: 'include', body: form })
      if (res.status === 201) {
        const { url } = (await res.json()) as { url: string }
        // Le chemin est persisté tel quel : l'origine est résolue au rendu, sinon un
        // changement de domaine invaliderait tous les médias déjà enregistrés.
        onUploaded(url, file.name)
      } else if (res.status === 413) {
        setError('Fichier trop volumineux (200 Mo maximum).')
      } else {
        setError('Upload échoué.')
      }
    } catch {
      setError('Erreur réseau.')
    } finally {
      setUploading(false)
    }
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
      <span style={hintStyle}>{uploading ? 'Envoi en cours…' : over ? 'Relâchez pour envoyer' : hint}</span>
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
